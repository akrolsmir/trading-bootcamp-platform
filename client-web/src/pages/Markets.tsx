import { useState } from "react";
import { toast } from "react-toastify";
import useWebSocket from "../lib/useWebSocket";
import { websocket_api } from "schema-js";
import { useNavigate } from "react-router-dom";

const FAIRS = {
  tw_sum_test: 378,
  tw_diff_test: 107.64,
  tw_avg_test: 94.5,
  tw_a_test: 148.32,
  tw_b_test: 112.5,
  tw_c_test: 76.5,
  tw_d_test: 40.68,
  tw_a_123_test: 49.4,
  tw_a_456_test: 49.4,
  tw_a_789_test: 49.4,
  tw_b_123_test: 37.5,
  tw_b_456_test: 37.5,
  tw_b_789_test: 37.5,
  tw_c_123_test: 25.5,
  tw_c_456_test: 25.5,
  tw_c_789_test: 25.5,
  tw_d_123_test: 13.6,
  tw_d_456_test: 13.6,
  tw_d_789_test: 13.6,
};

export function Markets() {
  const [orders, setOrders] = useState<Record<string, { size: string }>>({});
  const {
    markets: allMarkets,
    users,
    actingAs,
    sendClientMessage,
  } = useWebSocket();
  const navigate = useNavigate();

  const toShow = ["t1", "t2"];

  // Filter for open markets
  const markets = Object.fromEntries(
    Object.entries(allMarkets)
      // .filter(([_, market]) => market.open)
      // For this game, only show _test markets
      .filter(([_, market]) => market.name?.startsWith("tw_"))
  );

  const handleOrder = (marketId: number, side: "buy" | "sell") => {
    const size = orders[marketId]?.size;
    if (!size) {
      toast.error("Please enter a size");
      return;
    }

    sendClientMessage({
      createOrder: {
        marketId,
        size: parseInt(size),
        // Use mid price if available, otherwise 0
        price: 0,
        side:
          side === "buy" ? websocket_api.Side.BID : websocket_api.Side.OFFER,
      },
    });
  };

  const handleMarketClick = (id: string) => {
    navigate(`/market/${id}`);
  };

  return (
    <div className="container">
      <h2>Markets</h2>
      <table>
        <thead>
          <tr>
            <th>Market</th>
            <th>Bid / dice</th>
            <th>Bid</th>
            <th>Mid</th>
            <th>Fair/Diff</th>
            <th>Ask</th>
            <th>Ask / dice</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(markets).map(([id, market]) => {
            const bids =
              market.orders?.filter(
                (x) => x.side === websocket_api.Side.BID && x.price !== null
              ) || [];
            const offers =
              market.orders?.filter(
                (x) => x.side === websocket_api.Side.OFFER && x.price !== null
              ) || [];

            bids.sort((a, b) => b.price! - a.price!);
            offers.sort((a, b) => a.price! - b.price!);

            const bestBid = Math.max(
              market.minSettlement || 0,
              bids[0]?.price || 0
            );
            const bestOffer = Math.min(
              market.maxSettlement || 1_000_000_000_000,
              offers[0]?.price || 1_000_000_000_000
            );
            const mid = (bestBid + bestOffer) / 2;

            // If market name contains 123/456/789, dice = 3; else 9
            const numbers = ["123", "456", "789"];
            const dice = numbers.some((n) => market.name?.includes(n)) ? 3 : 9;
            const fair = FAIRS[market.name as keyof typeof FAIRS];

            return (
              <tr key={id}>
                <td>
                  <a
                    onClick={() => handleMarketClick(id)}
                    style={{ cursor: "pointer" }}
                  >
                    {market.name}
                  </a>
                </td>
                <td>
                  <h3 style={{ color: "#aaa" }}>
                    {(bestBid / dice).toFixed(1)}
                  </h3>
                </td>
                <td>
                  <h3>{bestBid}</h3>
                </td>
                <td>
                  <h3 style={{ color: "#aaa" }}>{mid}</h3>
                </td>
                <td>
                  <span style={{ color: "#666" }}>{fair?.toFixed(0)}</span>{" "}
                  <span style={{ color: "#aaa" }}>
                    {fair - mid > 0 ? "+" : ""}
                    {(fair - mid).toFixed(0)}
                  </span>
                </td>
                <td>
                  <h3>{bestOffer}</h3>
                </td>
                <td>
                  <h3 style={{ color: "#aaa" }}>
                    {(bestOffer / dice).toFixed(1)}
                  </h3>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
