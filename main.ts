// OBLOQ + Adafruit IO for micro:bit
// Wiring: micro:bit P0 -> OBLOQ RX, P1 -> OBLOQ TX, GND->GND
// Baud: 9600

//% color=#3AA3E3 icon="\uf1eb" block="OBLOQ AIO"
namespace obloqAio {
    let user = "", key = "", subTopic = ""
    let connected = false

    function send(cmd: string) { serial.writeString(cmd + "\r") }
    function isAck(s: string)  { return s.indexOf("|4|1|") >= 0 || s.indexOf("|2|") >= 0 }

    //% group="Setup"
    //% block="use OBLOQ on TX %tx RX %rx at %baud"
    export function usePins(tx: SerialPin, rx: SerialPin, baud: BaudRate): void {
        serial.redirect(tx, rx, baud)
        serial.setRxBufferSize(128)
        basic.pause(50)
    }

    //% group="Setup"
    //% block="connect Wi-Fi SSID %ssid password %pwd"
    export function connectWifi(ssid: string, pwd: string) {
        send(`|2|1|${ssid},${pwd}|`)
        basic.pause(4000)
    }

    //% group="Setup"
    //% block="connect Adafruit IO user %u key %k"
    export function connectAio(u: string, k: string) {
        user = u; key = k
        send(`|4|1|1|io.adafruit.com|1883|${u}|${k}|`)
        basic.pause(500)
        const line = serial.readUntil("\r")
        connected = line.indexOf("|4|1|1|1|") >= 0
    }

    //% group="MQTT"
    //% block="on message on feed %feed"
    //% draggableParameters="reporter"
    export function onMessage(feed: string, handler: (msg: string) => void) {
        subTopic = `${user}/f/${feed}`
        send(`|4|1|2|${subTopic}|`)
        basic.pause(300)
        serial.onDataReceived("\r", function () {
            const line = serial.readUntil("\r")
            if (line && !isAck(line)) handler(line)
        })
    }

    //% group="MQTT"
    //% block="publish %msg to feed %feed"
    export function publish(feed: string, msg: string | number) {
        const topic = `${user}/f/${feed}`
        send(`|4|1|3|${topic}|${msg}|`)
    }

    //% group="MQTT"
    //% block="disconnect"
    export function disconnect() { send("|4|1|4|") }

    //% group="Setup"
    //% block="AIO connected?"
    export function isConnected(): boolean { return connected }
}
