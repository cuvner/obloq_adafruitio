// OBLOQ + Adafruit IO for micro:bit
// Wiring (default): micro:bit P0 -> OBLOQ RX, P1 -> OBLOQ TX, GND->GND
// Baud: 9600
//% color=#3AA3E3 icon="\uf1eb" block="OBLOQ AIO"
namespace obloqAio {
    let user = ""
    let key = ""
    let connected = false
    let _subs: string[] = []  // remember subscribed topics (≤5)

    // ---- Internal helpers ----
    function send(cmd: string) { serial.writeString(cmd + "\r") }
    function isAck(line: string) {
        // OBLOQ acks/status lines typically include these fragments
        return line.indexOf("|4|1|") >= 0 || line.indexOf("|2|") >= 0
    }

    function tryMqttConnect(): boolean {
        send(`|4|1|1|io.adafruit.com|1883|${user}|${key}|`)
        basic.pause(600)
        const line = serial.readUntil("\r")
        return line.indexOf("|4|1|1|1|") >= 0
    }

    function resubscribeAll() {
        for (const t of _subs) {
            send(`|4|1|2|${t}|`)
            basic.pause(100)
        }
    }

    // ---- Setup ----

    /**
     * Use OBLOQ on default pins (TX=P0, RX=P1) at 9600
     */
    //% group="Setup"
    //% block="use OBLOQ on TX=P0 RX=P1 at 9600"
    export function useDefaultPins(): void {
        serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate9600)
        serial.setRxBufferSize(128)
        basic.pause(50)
    }

    /**
     * Choose pins and baud for OBLOQ
     * @param tx TX pin (micro:bit -> OBLOQ RX)
     * @param rx RX pin (micro:bit <- OBLOQ TX)
     * @param baud UART speed
     */
    //% group="Setup"
    //% block="use OBLOQ on TX %tx RX %rx at %baud"
    //% tx.defl=SerialPin.P0 rx.defl=SerialPin.P1 baud.defl=BaudRate.BaudRate9600
    //% tx.fieldEditor="gridpicker" tx.fieldOptions.columns=3
    //% rx.fieldEditor="gridpicker" rx.fieldOptions.columns=3
    export function usePins(tx: SerialPin, rx: SerialPin, baud: BaudRate): void {
        serial.redirect(tx, rx, baud)
        serial.setRxBufferSize(128)
        basic.pause(50)
    }

    /**
     * Connect to Wi-Fi
     * @param ssid Wi-Fi name
     * @param pwd Wi-Fi password
     */
    //% group="Setup"
    //% block="connect Wi-Fi SSID %ssid password %pwd"
    //% ssid.defl="YourWiFiSSID"
    //% pwd.defl="YourWiFiPassword"
    export function connectWifi(ssid: string, pwd: string): void {
        send(`|2|1|${ssid},${pwd}|`)
        basic.pause(4000) // OBLOQ streams progress; give it a moment
    }

    /**
     * Connect to Adafruit IO (MQTT, port 1883)
     * @param u AIO username
     * @param k AIO key
     */
    //% group="Setup"
    //% block="connect Adafruit IO user %u key %k"
    export function connectAio(u: string, k: string): void {
        user = u; key = k
        connected = tryMqttConnect()

        // Gentle background reconnect loop (every ~10s)
        control.inBackground(function () {
            while (true) {
                basic.pause(10000)
                if (!connected && user && key) {
                    connected = tryMqttConnect()
                    if (connected) resubscribeAll()
                }
            }
        })
    }

    /**
     * Are we connected to Adafruit IO?
     */
    //% group="Setup"
    //% block="AIO connected?"
    export function isConnected(): boolean { return connected }

    /**
     * Disconnect from MQTT
     */
    //% group="Setup"
    //% block="disconnect from Adafruit IO"
    export function disconnect(): void {
        send("|4|1|4|")
        connected = false
    }

    // ---- MQTT ----

    /**
     * Publish message to a feed
     * @param feed feed key (e.g. test)
     * @param msg message to send
     */
    //% group="MQTT"
    //% block="publish %msg|to feed %feed"
    //% feed.shadow="string" feed.defl="test"
    export function publish(feed: string, msg: string | number): void {
        const topic = `${user}/f/${feed}`
        send(`|4|1|3|${topic}|${msg}|`)
    }

    /**
     * Subscribe and run when a message arrives
     * @param feed feed key (e.g. test)
     * @param handler code to run with the message
     */
    //% group="MQTT"
    //% block="on message on feed %feed"
    //% draggableParameters="reporter"
    //% feed.shadow="string" feed.defl="test"
    export function onMessage(feed: string, handler: (message: string) => void): void {
        const topic = `${user}/f/${feed}`

        // Guard: up to 5 topics (OBLOQ limit). Ignore duplicates.
        if (_subs.indexOf(topic) < 0) {
            if (_subs.length >= 5) return
            _subs.push(topic)
        }

        send(`|4|1|2|${topic}|`)
        basic.pause(300)

        // OBLOQ pushes incoming payloads as CR-terminated lines
        serial.onDataReceived("\r", function () {
            const line = serial.readUntil("\r")
            // Ignore acks/status; deliver other lines as payload
            if (line && !isAck(line)) handler(line)
        })
    }
}
