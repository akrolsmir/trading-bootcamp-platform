import { FormEvent, useState } from "react";

import { websocket_api } from "schema-js";
import useWebSocket from "./lib/useWebSocket";

import { useParams, useNavigate } from "react-router-dom";

export function Market() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    sendClientMessage,
    stale,
    actingAs,
    portfolio,
    payments,
    ownerships,
    users,
    markets: allMarkets,
    lastMessage,
  } = useWebSocket();

  // Only show open markets
  const markets = Object.fromEntries(
    Object.entries(allMarkets).filter(([id, market]) => market.open)
  );

  const [marketId, setMarketId] = useState(id ? Number(id) : 0);

  const [orderType, setOrderType] = useState("bid");
  const [orderSize, setOrderSize] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  // Update URL when market changes
  const handleMarketChange = (newId: number) => {
    setMarketId(newId);
    navigate(`/market/${newId}`);
  };

  const marketLoaded = String(marketId) in markets;
  if (!marketLoaded) {
    return (
      <header className="container">
        <details className="dropdown">
          <summary role="button" className="secondary">
            Select market
          </summary>
          <ul>
            {Object.entries(markets).map(([id, market]) => {
              return (
                <li>
                  <a href="#" onClick={() => handleMarketChange(Number(id))}>
                    {market.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </details>
      </header>
    );
  }
  const market = markets[marketId];
  const bids =
    market.orders?.filter(
      (x) =>
        x.side === websocket_api.Side.BID &&
        x.price !== null &&
        "price" in x &&
        x.size
    ) || [];
  const offers =
    market.orders?.filter(
      (x) =>
        x.side === websocket_api.Side.OFFER &&
        x.price !== null &&
        "price" in x &&
        x.size
    ) || [];

  bids.sort((a, b) => b.price! - a.price!);
  offers.sort((a, b) => a.price! - b.price!);
  const bestBid = Math.max(market.minSettlement || 0, bids[0]?.price || 0);
  const bestOffer = Math.min(
    market.maxSettlement || 1_000_000_000_000,
    offers[0]?.price || 1_000_000_000_000
  );

  const handleOutAllOrders = () => {
    sendClientMessage({
      out: {
        marketId,
      },
    });
  };

  const handleSubmitOrder = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const size = parseFloat(orderSize);
    const price = parseFloat(orderPrice);

    if (isNaN(size) || isNaN(price) || size <= 0 || price < 0) {
      alert("Please enter valid size and price values.");
      return;
    }

    placeOrder({ size, price, side: orderType as "bid" | "offer" });
  };

  function placeOrder(props: {
    size: number;
    price: number;
    side: "bid" | "offer";
  }) {
    const order = {
      marketId: marketId,
      size: props.size,
      price: props.price,
      side:
        props.side === "bid"
          ? websocket_api.Side.BID
          : websocket_api.Side.OFFER,
    };

    sendClientMessage({
      createOrder: order,
    });
  }

  return (
    <>
      <header className="container">
        <h1>
          Currently viewing <em>{market.name}</em> and acting as{" "}
          <em>{users.get(actingAs || "")?.name}</em>.
        </h1>
        {market.closed ? (
          <h3>Market is settled at {market.closed.settlePrice}.</h3>
        ) : (
          <></>
        )}
        <nav>
          <ul>
            <li>
              <details className="dropdown">
                <summary role="button" className="secondary">
                  Select market
                </summary>
                <ul>
                  {Object.entries(markets).map(([id, market]) => {
                    return (
                      <li>
                        <a
                          href="#"
                          onClick={() => handleMarketChange(Number(id))}
                        >
                          {market.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container">
        <div className="container">
          <div className="grid">
            <div>
              <h3>Bids</h3>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Take</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, index) => (
                    <tr key={`bid-${index}`}>
                      <td>
                        {bid.ownerId == actingAs ? (
                          <ins>
                            {bid.ownerId ? users.get(bid.ownerId)?.name : ""}
                          </ins>
                        ) : bid.ownerId ? (
                          users.get(bid.ownerId)?.name
                        ) : (
                          ""
                        )}
                      </td>
                      <td>{bid.size}</td>
                      <td>
                        <a
                          style={{
                            cursor: "pointer",
                            fontSize: "1.3em",
                            marginRight: "0.5em",
                          }}
                          onClick={() =>
                            placeOrder({
                              size: bid.size || 0,
                              price: (bid.price || -0.01) + 0.01,
                              side: "bid",
                            })
                          }
                        >
                          🔼
                        </a>
                        <strong>{bid.price}</strong>
                      </td>
                      <td>
                        {bid.ownerId !== actingAs ? (
                          <button
                            style={{
                              backgroundColor: "pink",
                            }}
                            onClick={() =>
                              placeOrder({
                                size: bid.size || 0,
                                price: bid.price || 0,
                                side: "offer",
                              })
                            }
                          >
                            Take
                          </button>
                        ) : (
                          <button
                            style={{
                              backgroundColor: "lightgray",
                              color: "black",
                            }}
                            onClick={handleOutAllOrders}
                          >
                            Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3>Offers</h3>
              <table>
                <thead>
                  <tr>
                    <th>Take</th>
                    <th>Price</th>
                    <th>Size</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer, index) => (
                    <tr key={`offer-${index}`}>
                      <td>
                        {offer.ownerId !== actingAs ? (
                          <button
                            style={{ backgroundColor: "teal" }}
                            onClick={() =>
                              placeOrder({
                                size: offer.size || 0,
                                price: offer.price || 0,
                                side: "bid",
                              })
                            }
                          >
                            Take
                          </button>
                        ) : (
                          <button
                            style={{
                              backgroundColor: "lightgray",
                              color: "black",
                            }}
                            onClick={handleOutAllOrders}
                          >
                            Out
                          </button>
                        )}
                      </td>
                      <td>
                        <a
                          style={{
                            cursor: "pointer",
                            fontSize: "1.3em",
                            marginRight: "0.5em",
                          }}
                          onClick={() =>
                            placeOrder({
                              size: offer.size || 0,
                              price: (offer.price || 0) - 0.01,
                              side: "offer",
                            })
                          }
                        >
                          🔼
                        </a>
                        <strong>{offer.price}</strong>
                      </td>
                      <td>{offer.size}</td>
                      <td>
                        {offer.ownerId == actingAs ? (
                          <ins>
                            {offer.ownerId
                              ? users.get(offer.ownerId)?.name
                              : ""}
                          </ins>
                        ) : offer.ownerId ? (
                          users.get(offer.ownerId)?.name
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="container">
          <h3>Place an order</h3>
          <form onSubmit={handleSubmitOrder}>
            <div className="grid">
              <label>
                Order Type:
                <div className="grid">
                  <button
                    type="button"
                    style={{
                      backgroundColor:
                        orderType === "bid" ? "teal" : "transparent",
                      color: orderType === "bid" ? "white" : "inherit",
                    }}
                    onClick={() => setOrderType("bid")}
                  >
                    Bid
                  </button>
                  <button
                    type="button"
                    style={{
                      backgroundColor:
                        orderType === "offer" ? "pink" : "transparent",
                      color: orderType === "offer" ? "white" : "inherit",
                    }}
                    onClick={() => setOrderType("offer")}
                  >
                    Offer
                  </button>
                </div>
              </label>
              <label>
                Size:
                <input
                  type="number"
                  value={orderSize}
                  onChange={(e) => setOrderSize(e.target.value)}
                  placeholder="Enter size"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Price:
                <input
                  type="number"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  placeholder="Enter price"
                  step="0.01"
                  required
                />
              </label>
            </div>
            <button type="submit">Place Order</button>
          </form>
        </div>
        <div className="grid">
          <button onClick={handleOutAllOrders} className="contrast">
            Out on all orders
          </button>
        </div>
      </main>
    </>
  );
}
