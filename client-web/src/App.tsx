import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Markets } from "./pages/Markets";

import { Market } from "./Market";
import { Graphs } from "./pages/Graphs";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/market/:id" element={<Market />} />
        <Route path="/original" element={<Market />} />
        <Route path="/" element={<Markets />} />
        <Route path="/abcd" element={<Graphs />} />
      </Routes>
    </BrowserRouter>
  );
}
