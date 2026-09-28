import React from "react";
import { createRoot } from "react-dom/client";
import { CityApp as App } from "./city/CityApp.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
