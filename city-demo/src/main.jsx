import React from "react";
import { createRoot } from "react-dom/client";
import { CityApp as App } from "./city/CityApp.jsx";
import "./styles.css";
import {GuideOverlay} from './guide/GuideOverlay.jsx';

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <GuideOverlay />
  </React.StrictMode>,
);
