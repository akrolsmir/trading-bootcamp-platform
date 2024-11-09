import { useState } from "react";
import { toast } from "react-toastify";
import useWebSocket from "../lib/useWebSocket";

export function Markets() {
  const [orders, setOrders] = useState<Record<string, { size: string }>>({});
  const ws = useWebSocket();

  const handleOrder = (marketId: string, side: "buy" | "sell") => {
    const size = orders[marketId]?.size;
    if (!size) {
      toast.error("Please enter a size");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "placeOrder",
        marketId,
        side,
        size: parseFloat(size),
      })
    );
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
          {/* We'll need to map through markets here */}
          <tr>
            <td>BTC-USD</td>
            <td>50000</td>
            <td>50100</td>
            <td>50050</td>
            <td>
              <input
                type="number"
                step="0.01"
                value={orders["BTC-USD"]?.size || ""}
                onChange={(e) =>
                  setOrders((prev) => ({
                    ...prev,
                    "BTC-USD": { size: e.target.value },
                  }))
                }
              />
            </td>
            <td>
              <div className="grid">
                <button onClick={() => handleOrder("BTC-USD", "buy")}>
                  Buy
                </button>
                <button
                  onClick={() => handleOrder("BTC-USD", "sell")}
                  className="secondary"
                >
                  Sell
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
