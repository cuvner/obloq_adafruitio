// OBLOQ + Adafruit IO (minimal, known-good)
// Wiring: P0 (TX out) -> OBLOQ RX, P1 (RX in) -> OBLOQ TX, GND->GND
// Baud: 9600
//% color=#3AA3E3 icon="\uf1eb" block="OBLOQ AIO"

//% color=#3AA3E3 icon="\uf1eb" block="OBLOQ AIO"
namespace obloqAio {
    //% groups='["Setup","MQTT"]'
    // (optional, but helps toolbox layout)
    let user = ""
    let key = ""
    let connected = false

    function send(cmd: string) { serial.writeString(cmd + "\r") }
    function isAck(line: string) {
        return line.indexOf("|4|1|") >= 0 || line.indexOf("|2|") >= 0
    }

    /**
     * Use OBLOQ on default pins (TX=P0, RX=P1) at 9600 baud
     */
    //% group="Setup"
    //% block="use OBLOQ on TX=P0 RX=P1 at 9600"
    export function useDefaultPins(): void {
        serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate9600)
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
        basic.pause(4000)
    }

    /**
     * Connect to Adafruit IO (MQTT, port 1883)
     * @param u AIO username
     * @param k AIO key
     */
    //% group="Setup"
    //% block="connect Adafruit IO user %u key %k"
    export function connectAio(u: string, k: string): void {
        user = u
        key = k
        send(`|4|1|1|io.adafruit.com|1883|${u}|${k}|`)
        basic.pause(600)
        const line = serial.readUntil("\r")
        connected = line.indexOf("|4|1|1|1|") >= 0
    }

    /**
     * Are we connected to Adafruit IO?
     */
    //% group="Setup"
    //% block="AIO connected?"
    export function isConnected(): boolean {
        return connected
    }

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
        send(`|4|1|2|${topic}|`)
        basic.pause(300)
        serial.onDataReceived("\r", function () {
            const line = serial.readUntil("\r")
            if (line && !isAck(line)) handler(line)
        })
    }

    /**
     * Disconnect from MQTT
     */
    //% group="Setup"
    //% block="disconnect from Adafruit IO"
    export function disconnect(): void {
        send("|4|1|4|")
        connected = false
    }
}
