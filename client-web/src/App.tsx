import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Markets } from "./pages/Markets";

import { Market } from "./Market";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/market/:id" element={<Market />} />
        <Route path="/original" element={<Market />} />
        <Route path="/" element={<Markets />} />
      </Routes>
    </BrowserRouter>
  );
}
