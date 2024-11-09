import { useState } from "react";
import { toast } from "react-toastify";
import useWebSocket from "../lib/useWebSocket";
import { websocket_api } from "schema-js";
import { useNavigate } from "react-router-dom";

export function Markets() {
  const [orders, setOrders] = useState<Record<string, { size: string }>>({});
  const {
    markets: allMarkets,
    users,
    actingAs,
    sendClientMessage,
  } = useWebSocket();
  const navigate = useNavigate();

  // Filter for open markets
  const markets = Object.fromEntries(
    Object.entries(allMarkets)
      .filter(([_, market]) => market.open)
      // For this game, only show _test markets
      .filter(([_, market]) => market.name?.endsWith("_test"))
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
            <th>Bid</th>
            <th>Ask</th>
            <th>Mid</th>
            <th>Order Size</th>
            <th>Actions</th>
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
                <td>{bestBid}</td>
                <td>{bestOffer}</td>
                <td>{mid}</td>
                <td>
                  <input
                    type="number"
                    step="1"
                    value={orders[id]?.size || ""}
                    onChange={(e) =>
                      setOrders((prev) => ({
                        ...prev,
                        [id]: { size: e.target.value },
                      }))
                    }
                  />
                </td>
                <td>
                  <button onClick={() => handleOrder(Number(id), "buy")}>
                    Buy
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleOrder(Number(id), "sell")}
                    className="secondary"
                  >
                    Sell
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
