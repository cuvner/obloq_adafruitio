// OBLOQ + Adafruit IO for micro:bit
// Wiring: micro:bit P0 -> OBLOQ RX, P1 -> OBLOQ TX, GND->GND
// Baud: 9600

//% color=#3AA3E3 icon="\uf1eb" block="OBLOQ AIO"
namespace obloqAio {
    let _user = ""
    let _key = ""
    let _topicSub = ""
    let _connected = false

    // Internal: send one OBLOQ command (ends with CR)
    function send(cmd: string) {
        serial.writeString(cmd + "\r")
    }

    // Internal: very small parser for “OK” tokens in replies
    function replyHas(fragment: string): boolean {
        const s = serial.readUntil("\r")
        return s.indexOf(fragment) >= 0
    }

    /**
     * Redirect serial to pins and set baud for OBLOQ
     */
    //% block="use OBLOQ on TX=P0 RX=P1 at 9600"
    //% weight=100
    export function useDefaultPins(): void {
        serial.redirect(SerialPin.P0, SerialPin.P1, BaudRate.BaudRate9600)
        basic.pause(50)
    }

    /**
     * Connect to Wi-Fi
     * @param ssid Wi-Fi name
     * @param pwd Wi-Fi password
     */
    //% block="connect Wi-Fi SSID %ssid password %pwd"
    //% ssid.defl="YourWiFiSSID"
    //% pwd.defl="YourWiFiPassword"
    //% weight=95
    export function connectWifi(ssid: string, pwd: string): void {
        send("|2|1|" + ssid + "," + pwd + "|")
        // OBLOQ streams progress; give it a moment
        basic.pause(4000)
    }

    /**
     * Connect to Adafruit IO (MQTT, port 1883)
     * @param user AIO username
     * @param key AIO key
     */
    //% block="connect Adafruit IO user %user key %key"
    //% weight=90
    export function connectAio(user: string, key: string): void {
        _user = user
        _key = key
        send("|4|1|1|io.adafruit.com|1883|" + user + "|" + key + "|")
        basic.pause(500)
        _connected = replyHas("|4|1|1|1|") // simple success marker
    }

    /**
     * Subscribe to a feed and run code when a message arrives
     * @param feed feed key (e.g. test)
     * @param handler code to run when a message arrives
     */
    //% block="on message on feed %feed"
    //% draggableParameters="reporter"
    //% weight=85
    export function onMessage(feed: string, handler: (message: string) => void): void {
        _topicSub = `${_user}/f/${feed}`
        send("|4|1|2|" + _topicSub + "|")
        basic.pause(300)

        // OBLOQ pushes incoming payloads as lines ending with \r
        serial.onDataReceived("\r", function () {
            const line = serial.readUntil("\r")
            // naive filter: treat any non-ACK line as payload
            if (line.length > 0 && line.indexOf("|4|1|") < 0) {
                handler(line)
            }
        })
    }

    /**
     * Publish message to a feed
     * @param feed feed key (e.g. test)
     * @param msg message text/number
     */
    //% block="publish %msg|to feed %feed"
    //% weight=80
    export function publish(feed: string, msg: string | number): void {
        const topic = `${_user}/f/${feed}`
        send("|4|1|3|" + topic + "|" + msg + "|")
    }

    /**
     * Quick status
     */
    //% block="AIO connected?"
    //% weight=70
    export function isConnected(): boolean {
        return _connected
    }
}
