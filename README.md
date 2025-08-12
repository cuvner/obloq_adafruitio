# OBLOQ + Adafruit IO blocks (micro:bit)

Kid-friendly MakeCode blocks to connect a micro:bit to Wi-Fi (DFRobot OBLOQ) and publish/subscribe with Adafruit IO.

## Wiring (default)
- micro:bit **P0 (TX)** → OBLOQ **RX**
- micro:bit **P1 (RX)** → OBLOQ **TX**
- **GND ↔ GND**, power OBLOQ at **3.3 V**
- UART **9600 baud**

## Install in MakeCode
1. Make your repo public.  
2. In MakeCode (micro:bit): **Extensions → “Enter URL…” →** paste your repo URL.  
3. Blocks appear under **OBLOQ AIO**.

## First project (2 minutes)
**On start**
- `use OBLOQ on TX=P0 RX=P1 at 9600`
- `connect Wi-Fi SSID … password …`
- `connect Adafruit IO user … key …`

**Forever**
- `publish` counter `to feed` `test` every 2000 ms

**On message on feed test**
- show the message on the LED display

Then open your Adafruit IO dashboard and add a block for the `test` feed to see values arrive.

## Extra blocks
- `use OBLOQ on TX %tx RX %rx at %baud` — for custom wiring/baud  
- `disconnect from Adafruit IO`  
- `AIO connected?`


## Notes
- Keep publish rate ≥ 2 s to avoid AIO free-tier throttling.
- MQTT topics use the short form: `{username}/f/{feed}`.
- If connect fails, double-check AIO **username** and **key** (not your account password).

## Credits
Inspired by DFRobot’s OBLOQ work for micro:bit. This extension focuses on a minimal, classroom-friendly MQTT flow for Adafruit IO. Licensed MIT.
