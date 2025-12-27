<div align="center">

# 🔥 Chamber‑API  
### The backend engine powering the Chamber reloading & firearms management ecosystem

**Modular. Self‑hosted. Precision‑focused.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-.NET%208-blue)
![Status](https://img.shields.io/badge/status-active--development-orange)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

</div>

---

**Chamber‑API** is the backend service for the **Chamber** ecosystem — a modular, self‑hosted platform for reloaders, shooters, and firearm enthusiasts. It provides a secure, extensible REST API for managing cartridges, projectiles, powders, load recipes, ammo lots, brass inventory, firearms, accessories, maintenance logs, range logs, and ballistic trajectory calculations.

Chamber‑API is designed to pair with **Chamber‑UI**, a customized fork of the Audiobookshelf interface, delivering a clean and intuitive experience for organizing reloading data, firearm configurations, and ballistic information.

---

## Features

### 🔧 Reloading Data Management
- Cartridges, projectiles, powders  
- Load recipes (“ammo formulas”)  
- Ammo lots with batch labels and QR codes  
- Powder, primer, and brass lot tracking  
- Full brass lifecycle and case prep workflow  

### 🔫 Firearm & Accessory Management
- Firearm profiles with barrel, twist, and chambering  
- Blue Book value, purchase history, and condition tracking  
- Accessories (scopes, suppressors, bipods, etc.)  
- Maintenance logs and round‑count tracking  
- Zero profiles tied to ammo lots  

### 📦 Inventory Tracking
- Ammo lot quantities  
- Brass batches and prep stages  
- Component usage and consumption  

### 🎯 Ballistic Trajectory Engine
- G1/G7 drag model support  
- Drop, drift, velocity, and energy curves  
- Zero distance and sight height adjustments  
- Environmental inputs (temp, altitude, wind)  
- API‑driven graph generation for Chamber‑UI  

### 🌐 External Data Import
- Import projectiles, powders, and cartridges from **GRT**  
- Import cartridge and factory ammo metadata from **Ammolytics**  
- Automatic merging into Chamber’s internal data model  
- Source tracking and safe updates  

---

## Architecture

Chamber‑API follows a clean, modular structure:
•	Chamber.Api/: Entry point for the API, handling HTTP requests and responses.
•	Chamber.Core/: Contains core business logic and domain models.
•	Chamber.Data/: Responsible for data access and persistence.
•	Chamber.Services/: Implements application services and business operations.
•	Chamber.Tests/: Contains unit and integration tests for the solution.

The API communicates with Chamber‑UI over REST and is designed for containerized deployment.

---

## Tech Stack

- ASP.NET Core  
- Entity Framework Core  
- SQLite / PostgreSQL (configurable)  
- C# 12  
- Docker / Docker Compose  
- GRT & Ammolytics dataset importers  

---

## License

This project is licensed under the **MIT License**, allowing broad use, modification, and self‑hosting while keeping the project open and accessible.

---

## Status

Chamber‑API is currently in active development.  
Core models, importers, and trajectory services are being implemented as part of the initial release.

---

## Related Projects

- **Chamber‑UI** — Frontend interface for the Chamber ecosystem  
- **Gordon’s Reloading Tool (GRT)** — External ballistic data source  
- **Ammolytics** — Cartridge and factory ammo datasets  

---

## Roadmap (High‑Level)

- [ ] Core data models (cartridges, projectiles, powders)  
- [ ] Importers for GRT and Ammolytics  
- [ ] Load recipe + ammo lot system  
- [ ] Brass inventory + case prep workflow  
- [ ] Firearm + accessory management  
- [ ] Range logs + round count tracking  
- [ ] Ballistic trajectory engine  
- [ ] QR code generation for ammo lots and firearms  
- [ ] Full integration with Chamber‑UI  

