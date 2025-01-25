/**
 * Deobfuscated by mtncrash
 * 
 * Original code is https://github.com/MeoMunDep/Hivera/tree/main/Hivera
 * 
 * Only intended for deob education and to troll meomundep just a little <3
 * 
 * Hivera (hivera.org) is a project that lets you earn money by
 * "lending bandwidth" for AI development.
 * 
 * This bot script does very similar things to meomundep's other repos. Using
 * various techniques to avoid bot detection like proxy cycling, and header
 * spoofing they create accounts through the API, connect, and complete daily
 * tasks to gain rewards.
 * 
 * I do appreciate the extra effort put into making the CLI look nice while
 * this runs. The artwork is cute, and colors are always nice.
 */

"use strict";
// Couple of unused imports here, leaving in case I missed some things
const qs = require("qs");
const url = require("url");
const axios = require("axios");
const https = require("https");
const colors = require("colors");
// Initialize setInterval to execute bg every 3 seconds
setInterval(bg, 3000);

const ws = require("ws");
const querystring = require("querystring");
const crypto = require("crypto");
const fs = require("fs").promises;
const cryptoJs = require("crypto-js");
const formData = require("form-data");
const {
  v4: uuid
} = require("uuid");
const userAgents = require("user-agents");
const readlineSync = require("readline-sync");
const {
  SocksProxyAgent
} = require("socks-proxy-agent");
const {
  HttpsProxyAgent
} = require("https-proxy-agent");
const {
  spawn
} = require("child_process");

// Clear the console
function clearConsole() {
  if (process.platform === "win32") {
    spawn("cmd.exe", ["/c", "cls"], {
      stdio: "inherit"
    });
  } else {
    process.stdout.write("[2J[3J[H");
  }
}
const botJs = "bot.js";
let totalAccounts;
let currentAccountIndex = 0;
let config;
let proxies = [];
let proxyMap = new Map();
const errorLog = {
  symbol: "[!]",
  color: colors.red
};
const updateLog = {
  symbol: "[^]",
  color: colors.cyan
};
const didLog = {
  symbol: "[>]",
  color: colors.blue
};
const returnLog = {
  symbol: "[/]",
  color: colors.grey
};
const infoLog = {
  symbol: "[+]",
  color: colors.green
};
const announceLog = {
  symbol: "[*]",
  color: colors.yellow
};
const pendingLog = {
  symbol: "[%]",
  color: colors.magenta
};
const failLog = {
  symbol: "[-]",
  color: colors.brightRed
};
const successLog = {
  symbol: "[√]",
  color: colors.bold.brightGreen
};
const warningLog = {
  symbol: "[?]",
  color: colors.bold.brightYellow
};
const logTypes = {
  err: errorLog,
  upd: updateLog,
  did: didLog,
  ret: returnLog,
  inf: infoLog,
  ann: announceLog,
  pen: pendingLog,
  fai: failLog,
  suc: successLog,
  war: warningLog
};
const defaultLogTypes = logTypes;
const defaultHeaders = {
  Accept: "*/*",
  scheme: "https",
  Connection: "keep-alive",
  "Sec-CH-UA-Mobile": "?1",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Site": "same-site",
  "Sec-CH-UA-Platform": "\"Android\"",
  "Content-Type": "application/json",
  "Accept-Encoding": "gzip, deflate, br",
  "x-requested-with": "org.telegram.messenger",
  "Sec-CH-UA": "\"Not A;Brand\";v=\"99\", \"Android\";v=\"12\""
};
const proxyProtocols = {
  _s5: ["socks4:", "socks5:"],
  _htp: ["http:", "https:"]
};
const defaultHttpsAgent = new https.Agent({
  rejectUnauthorized: false
});
const defaultAxiosConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  httpsAgent: defaultHttpsAgent
};
const defaultAxiosInstance = axios.create(defaultAxiosConfig);

class HiveraAccount {
  #retryCount = 0;
  #maxRetries = 3;
  #lastProxyRotation = Date.now();
  constructor(data, proxy, accountNumber) {

    this.accountNumber = accountNumber;
    this.data = String(data || "").trim();
    this.initialProxy = String(proxy || "").trim();
    this.currentProxy = String(proxy || "").trim();
    this.currentColor = "";
    this.retryUrlCount = 0;
    this.accountNumber = accountNumber;
    this.id = "";
    this.url = "";
    this.token = "";
    this.tasks = "";
    this.power = 0;
    this.anotherCounter = 0;
    this.ws = null;
    this.wsState = "";
    this.headers = this.initializeHeaders();
    this.proxyAgent = this.currentProxy ? this.createProxyAgent(url.parse(this.currentProxy)) : null;
    this.useProxyRotation = config.rotateProxy || false;
    this.proxyRotationInterval = (config.proxyRotationInterval || 2) * 60 * 60 * 1000;
    this.allowNoProxy = true;
    if (this.currentProxy) {
      proxyMap.set(this.currentProxy, this.accountNumber);
    }
    this.banner = "\n                        \n                                        ▄▀▀▄ ▄▀▄  ▄▀▀█▄▄▄▄  ▄▀▀▀▀▄   ▄▀▀▄ ▄▀▄  ▄▀▀▄ ▄▀▀▄  ▄▀▀▄ ▀▄  ▄▀▀█▄▄   ▄▀▀█▄▄▄▄  ▄▀▀▄▀▀▀▄ \n                                      █  █ ▀  █ ▐  ▄▀   ▐ █      █ █  █ ▀  █ █   █    █ █  █ █ █ █ ▄▀   █ ▐  ▄▀   ▐ █   █   █ \n                                      ▐  █    █   █▄▄▄▄▄  █      █ ▐  █    █ ▐  █    █  ▐  █  ▀█ ▐ █    █   █▄▄▄▄▄  ▐  █▀▀▀▀  \n                                          █    █    █    ▌  ▀▄    ▄▀   █    █    █    █     █   █    █    █   █    ▌     █      \n                                        ▄▀   ▄▀    ▄▀▄▄▄▄     ▀▀▀▀   ▄▀   ▄▀      ▀▄▄▄▄▀  ▄▀   █    ▄▀▄▄▄▄▀  ▄▀▄▄▄▄    ▄▀       \n                                        █    █     █    ▐            █    █               █    ▐   █     ▐   █    ▐   █         \n                                        ▐    ▐     ▐                 ▐    ▐               ▐        ▐         ▐        ▐         \n                        \n                        \n                                                              " + colors.green("Contact") + ":       " + colors.yellow("t.me/MeoMunDep") + " \n                                                              " + colors.red("Group") + ":         " + colors.yellow("t.me/KeoAirDropFreeNe") + "\n                                                              " + colors.blue("Channel") + ":       " + colors.yellow("t.me/KeoAirDropFreeNee") + "    \n";
  }

  initializeHeaders() {
    return {
      ...defaultHeaders,
      authority: "api.hivera.org",
      Origin: "https://app.hivera.org",
      Referer: "https://app.hivera.org/",
      "User-Agent": new userAgents({
        deviceCategory: "mobile"
      }).toString()
    };
  }

  getTimeString(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
  }

  getRandomChars(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charsLength = chars.length;
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * charsLength);
      result += chars.charAt(index);
    }
    return result;
  }

  async randomDelay(min, max) {
    await this.delay(this.getRandomNumber(min, max));
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomColor(text) {
    const colorsArray = [colors.red, colors.grey, colors.blue, colors.cyan, colors.green, colors.white, colors.yellow, colors.brightRed, colors.brightBlue, colors.brightCyan, colors.brightWhite, colors.brightGreen, colors.brightYellow, colors.brightMagenta];
    let color;
    do {
      color = colorsArray[Math.floor(Math.random() * colorsArray.length)];
    } while (color === this.currentColor);
    this.currentColor = color;
    return color(text);
  }

  async countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      process.stdout.write(this.getRandomColor("\r----------------------->>>>>>>> Waiting for " + i + " seconds to restart all Account <<<<<<<<-----------------------"));
      await this.delay(1);
    }
  }

  async delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  log(message, type) {
    if (!message && !type) {
      console.log(this.getCompletedMessage());
      return;
    }
    const time = this.getTime();
    const defaultLogType = {
      symbol: "[#]",
      color: colors.white
    };
    const logType = defaultLogTypes[type] || defaultLogType;
    const formattedMessage = "[" + colors.grey(time) + "] - ↓ " + colors.italic("@MeoMunDep x Hivera") + " ↑ - " + logType.symbol + " Account " + colors.white(this.accountNumber) + " | " + message;
    console.log(logType.color(formattedMessage));
  }

  getTime() {
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };
    return new Date().toLocaleString(config.timeZone, options);
  }

  getCompletedMessage() {
    const time = this.getTime();
    return "[" + colors.grey(time) + "] " + "-".grey + " ↑ " + colors.blue.italic("@MeoMunDep x Hivera") + " ↓ " + "-".grey + " [#] " + colors.bold(colors.yellow("Completed all accounts, i will take a rest now, see you then ^^"));
  }

  async getAvailableProxy() {
    await this.delay(Math.random() * 0.5);
    let availableProxies = proxies.filter(proxy => {
      const accountNumber = proxyMap.get(proxy);
      return !accountNumber || accountNumber === this.accountNumber;
    });
    if (this.allowNoProxy && !proxyMap.has("")) {
      availableProxies.push("");
    }
    if (availableProxies.length === 0) {
      await this.delay(this.getRandomNumber(3, 5));
      return this.getAvailableProxy();
    }
    return availableProxies;
  }

  async assignProxy() {
    const availableProxies = await this.getAvailableProxy();
    const randomIndex = Math.floor(Math.random() * availableProxies.length);
    const proxy = availableProxies[randomIndex];
    this.releaseProxy();
    this.reserveProxy(proxy);
    this.currentProxy = proxy;
    this.proxyAgent = proxy ? this.createProxyAgent(url.parse(proxy)) : null;
    return proxy;
  }

  releaseProxy() {
    if (this.currentProxy && proxyMap.get(this.currentProxy) === this.accountNumber) {
      proxyMap.delete(this.currentProxy);
    }
  }

  reserveProxy(proxy) {
    this.releaseProxy();
    if (proxy) {
      proxyMap.set(proxy, this.accountNumber);
    }
  }

  async rotateProxy() {
    if (!this.useProxyRotation) {
      return;
    }
    const now = Date.now();
    if (now - this.#lastProxyRotation < this.proxyRotationInterval) {
      return;
    }
    const availableProxies = await this.getAvailableProxy();
    if (availableProxies.length === 0) {
      this.log("No available proxies for rotation - keeping current proxy", "err");
      return;
    }
    const otherProxies = availableProxies.filter(proxy => proxy !== this.currentProxy);
    if (otherProxies.length === 0) {
      this.log("No new proxies available for rotation - keeping current proxy", "err");
      return;
    }

    function extractIPAddress(proxyString) {
      if (!proxyString) {
        return null;
      }
      const regexps = [/@([\d\.]+):/, /^([\d\.]+):/, /([\d\.]+)$/];
      for (const regexp of regexps) {
        const match = proxyString.match(regexp);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    }

    const randomIndex = Math.floor(Math.random() * otherProxies.length);
    const newProxy = otherProxies[randomIndex];
    const newIPAddress = extractIPAddress(newProxy);
    const currentIPAddress = extractIPAddress(this.currentProxy);
    this.releaseProxy();
    this.reserveProxy(newProxy);
    this.log("Rotated from: " + (currentIPAddress ? colors.green(currentIPAddress) : colors.yellow("No Proxy")) + " to " + (newIPAddress ? colors.magenta(newIPAddress) : colors.yellow("No Proxy")), "upd");
    this.currentProxy = newProxy;
    this.proxyAgent = newProxy ? this.createProxyAgent(url.parse(newProxy)) : null;
    this.#lastProxyRotation = now;
    await this.checkProxyIp();
  }

  async clearLogin() {
    this.releaseProxy();
  }

  createProxyAgent(proxyUrl) {
    const options = {
      rejectUnauthorized: false
    };

    if (proxyProtocols._s5.includes(proxyUrl.protocol)) {
      return new SocksProxyAgent(this.currentProxy, options);
    }
    if (proxyProtocols._htp.includes(proxyUrl.protocol)) {
      return new HttpsProxyAgent(this.currentProxy, options);
    }
    return null;
  }

  getRequestConfig() {
    const config = {
      headers: this.headers,
      timeout: 30000,
      httpsAgent: defaultHttpsAgent
    };

    if (this.proxyAgent) {
      config.httpsAgent = this.proxyAgent;
    }
    return config;
  }

  async printBanner() {
    console.clear();
    console.log(colors.grey(" ".repeat(Math.floor(Math.max((process.stdout.columns || 80 - this.banner.length) / 2, 0))) + this.banner));
    for (let i = 3; i > 0; i--) {
      let text = colors.green("Hivera");
      if (i === 2) {
        text = colors.yellow("Hivera");
      } else if (i === 1) {
        text = colors.red("Hivera");
      }
      const centeredText = " ".repeat(Math.floor(Math.max((process.stdout.columns || 80 - text.length) / 2, 0))) + colors.magenta(text);
      process.stdout.write("\r" + centeredText);
      await this.delay(1);
    }
    clearConsole();
  }

  async checkUrl(url) {
    const methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    for (const method of methods) {
      try {
        const requestConfig = {
          url: url,
          method: method,
          httpsAgent: httpsAgent,
          validateStatus: () => true
        };
        const response = await axios(requestConfig);
        if (response.status !== 404) {
          return true;
        }
      } catch (error) {}
    }
    if (this.retryUrlCount < 3) {
      this.log("I will reconnect due to " + colors.brightRed("API") + " error - [" + colors.yellow(++this.retryUrlCount) + "]", "ret");
      await this.main();
    }
    this.log("The game may change the " + colors.magenta("API") + ", please notify me in " + colors.yellow("t.me/keoairdropfreene"), "err");
    process.exit(1);
  }

  async makeRequest(method, url, data = null) {
    await this.rotateProxy();
    const requestConfig = this.getRequestConfig();
    await this.checkUrl(url);
    try {
      const response = method === "get" ? await defaultAxiosInstance.get(url, requestConfig) : await defaultAxiosInstance[method](url, data, requestConfig);
      this.#retryCount = 0;
      return response.data;
    } catch (error) {}
  }

  async checkProxyIp() {
    const defaultConfig = {
      httpsAgent: defaultHttpsAgent
    };
    const headers = {
      "Content-Type": "application/json"
    };
    const requestConfig = {
      ...(this.currentProxy ? {
        httpsAgent: this.proxyAgent
      } : defaultConfig)
    };
    requestConfig.timeout = 10000;
    requestConfig.headers = headers;

    try {
      const response = await defaultAxiosInstance.get("https://api.ipify.org?format=json", requestConfig);
      const ip = response.data.ip;
      this.log(colors.yellow("Connection Details") + ":", "inf");
      this.log("├─ IP: " + colors.grey(ip), "inf");
      this.log("└─ Proxy: " + (this.currentProxy ? colors.blue("ACTIVE") : colors.red("NOT USED")), "inf");
      return true;
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        this.log("Connection refused - " + colors.blue("proxy") + " may be " + colors.brightMagenta("invalid") + " or " + colors.brightGreen("blocked"), "err");
      } else if (error.code === "ETIMEDOUT") {
        this.log("Connection " + colors.grey("timed out") + " - " + colors.blue("Proxy") + " may be " + colors.yellow("slow") + " or " + colors.green("unreachable") + ".", "err");
      } else if (error.toString().includes("407")) {
        this.log(colors.bold.cyan("Proxy") + " validiation failed, check " + colors.yellow("proxy data") + " again!", "err");
      } else if (error.toString().includes("402")) {
        this.log(colors.bold.cyan("Proxy") + " is " + colors.bold.grey("expired") + ", please choose another one!", "err");
      }
      return false;
    }
  }

  async handleRequestError(error, method, url, data) {
    if (this.#retryCount < this.#maxRetries) {
      this.#retryCount++;
      this.log("Retry attempt " + colors.red(this.#retryCount) + " of " + colors.red(this.#maxRetries), "ret");
      await this.delay(this.#retryCount * 2);
      return this.makeRequest(method, url, data);
    }
    if (error.response) {
      throw new Error("Request failed: " + error.response.status + " - " + error.response.statusText);
    } else if (error.request) {
      throw new Error("No " + colors.yellow("response") + " received from server!");
    }
    throw new Error("Request setup failed: " + colors.blue(error.message));
  }

  async handleLoginError(error) {
    if (error?.status === 401 || error?.response?.data.toString().includes("401")) {
      this.log(colors.magenta("Datas") + ", retrive it again!", "fai");
    } else if (error?.status === 403 || error?.response?.data.toString().includes("403")) {
      this.log("Failed to login, try to change " + colors.magenta("PROXY") + " or " + colors.magenta("IP") + "!", "fai");
    } else {
      this.log(colors.magenta("Login") + " failed, retreive " + colors.bold.grey("data") + " again!", "err");
    }
    this.log("Is reconnecting...", "ret");
    await this.delay(this.getRandomNumber(3, 5));
    await this.main();
  }

  async getSessionId() {
    try {
      const response = await this.makeRequest("get", "https://api.hivera.org/engine/session?auth_data=" + encodeURIComponent(this.data));
      return response.result.session_id;
    } catch (error) {
      return uuid().toString();
    }
  }
  getRandomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async getReferralData() {

    const now = Date.now();
    const qualityConnection = this.getRandomNumberInRange(68, 93);
    const sessionId = await this.getSessionId();
    const data = {
      from_date: now,
      quality_connection: qualityConnection,
      times: 6,
      session_id: sessionId
    };
    return data;
  }

  async registerHiveraNode() {
    try {
      await this.makeRequest("get", "https://api.hivera.org/users/create_payment?upgrade_type=mode&upgrade_slug=access-ticket&auth_data=" + encodeURIComponent(this.data));
      if (r?.result.ok) {
        this.log("Registered " + colors.bold.yellow("hivera") + " node successfully!", "did");
      }
    } catch (error) {}
    await this.delay(1);
    try {
      await this.makeRequest("get", "https://api.hivera.org/engine/activities?auth_data=" + encodeURIComponent(this.data));
    } catch (error) {}
    await this.delay(1);
    try {
      await this.makeRequest("get", "https://api.hivera.org/engine/activities?auth_data=" + encodeURIComponent(this.data));
    } catch (error) {}
  }

  async submitHivera() {
    await this.registerHiveraNode();
    this.log("Is submitting " + colors.bold.yellow("hivera") + "...", "pen");
    const submitTask = async () => {
      try {
        const referralData = await this.getReferralData();
        const response = await axios.post("https://api.hivera.org/v2/engine/contribute?auth_data=" + encodeURIComponent(this.data), referralData, this.getRequestConfig());
        if (response) {
          return response;
        } else {
          return false;
        }
      } catch (error) {
        if (error.response.data.includes("Cloudflare")) {
          this.log("Server is " + colors.bold.green("BLOCKING") + ", please change your " + colors.bold.cyan("PROXY") + " or stop the " + colors.bold.cyan("SCRIPT") + " for safety!", "err");
          await this.delay(60);
        } else {
          this.log("Error while submitting " + colors.bold.yellow("hivera"), "err");
          await this.delay(60);
        }
        return false;
      }
    };
    while (this.power > 500) {
      try {
        const response = await submitTask();
        if (response) {
          this.power = response?.result?.profile?.POWER;
        }
      } catch (error) {}
      await this.delay(this.getRandomNumber(3, 5));
    }
    this.log("Submitted " + colors.bold.yellow("hivera") + " successful!", "suc");
  }

  async doTasks() {
    this.log("Is doing " + colors.red("tasks") + "...", "pen");
    const taskUrls = ["https://api.hivera.org/daily-tasks?auth_data=" + encodeURIComponent(this.data), "https://api.hivera.org/missions?auth_data=" + encodeURIComponent(this.data)];
    for (const taskUrl of taskUrls) {
      try {
        let tasks = await this.makeRequest("get", taskUrl);
        await this.delay(this.getRandomNumber(3, 5));
        for (const task of tasks.result) {
          if (task?.complete) {
            continue;
          }
          try {
            const response = await this.makeRequest("get", "https://api.hivera.org/missions/complete?mission_id=" + task.id + "&auth_data=" + encodeURIComponent(this.data));
            if (response?.result == "done") {
              this.log("Completed task: " + colors.bold.cyan(task.name), "suc");
            } else {
              this.log("Failed to complete task: " + colors.bold.cyan(task.name), "fai");
            }
          } catch (error) {
            this.log("Error while processing task: " + colors.bold.yellow(task.name), "err");
          }
          await this.delay(this.getRandomNumber(1, 1.5));
        }
      } catch (error) {
        this.log("Cannot get " + colors.grey("tasks") + " data! ", "err");
      }
    }
    this.log("Completed all available " + colors.red("tasks") + "!", "ann");
    await this.delay(this.getRandomNumber(3, 5));
  }

  async login() {
    const userData = this.getUserData();
    try {
      let referralResponse = await this.makeRequest("get", "https://api.hivera.org/referral?referral_code=" + config.referralCode + "&auth_data=" + encodeURIComponent(this.data));
      this.log(colors.blue("Login") + " successful!", "ann");
      await this.delay(this.getRandomNumber(3, 5));
      try {
        let authResponse = await this.makeRequest("get", "https://api.hivera.org/auth?auth_data=" + encodeURIComponent(this.data));
        let infoResponse = await this.makeRequest("get", "https://api.hivera.org/engine/info?auth_data=" + encodeURIComponent(this.data));
        this.power = infoResponse.result.profile.POWER;
        this.log("Name: " + colors.yellow(userData.username) + " | Power: " + colors.yellow(this.power) + " - Power capacity: " + colors.cyan(infoResponse.result.profile.POWER_CAPACITY), "inf");
      } catch (error) {
        this.log("Failed to fetch " + colors.magenta("User") + " data!", "err");
      }
    } catch (error) {
      await this.handleLoginError(error);
    }
    await this.delay(this.getRandomNumber(3, 5));
  }

  async main() {
    try {
      const delay = config.delayEachAccount;
      const randomDelay = this.getRandomNumber(delay[0], delay[1]);
      this.log("Will start in " + colors.grey(randomDelay) + " seconds...", "pen");
      await this.delay(randomDelay);
      try {
        await this.assignProxy();
      } catch (error) {}
      const proxyCheckResult = await this.checkProxyIp();
      if (!proxyCheckResult && this.currentProxy) {
        if (config.skipInvalidProxy) {
          this.log("Skipping login due to invalid " + colors.blue("proxy"), "err");
          return;
        } else {
          this.log("Login due to invalid " + colors.green("proxy"), "upd");
        }
      }
      await this.login();
      if (config.doTasks) {
        await this.doTasks();
      }
      await this.submitHivera();
    } catch (error) {
      if (error.message.toString().includes("is not valid JSON")) {
        this.log("You fill the wrong " + colors.cyan("data") + " type, please " + colors.red("retrive") + " again!", "war");
      } else {
        this.log(colors.bold.green("Bot") + " broken somewhere, notify me in " + colors.bold.magenta("group") + "!", "war");
      }
      this.log(colors.bold.red("Attempting") + " reconnection...", "ret");
      await this.delay(3);
      await this.main();
    } finally {
      await this.clearLogin();
    }
    await this.delay(this.getRandomNumber(3, 5));
  }

  getUserData() {
    const parsedData = querystring.parse(this.data);
    const user = JSON.parse(parsedData.user);
    const userData = {
      query_id: parsedData.query_id || null,
      id: user.id,
      hash: parsedData.hash,
      username: user.username,
      last_name: user.last_name,
      tg_login_params: this.data,
      first_name: user.first_name,
      auth_date: parsedData.auth_date,
      signature: parsedData.signature,
      photo_url: user.photo_url,
      chat_type: parsedData.chat_type,
      start_param: parsedData.start_param,
      language_code: user.language_code,
      chat_instance: parsedData.chat_instance,
      allows_write_to_pm: user.allows_write_to_pm
    };
    return userData;
  }
}

async function start() {
  try {
    config = await fs.readFile("configs.json", "utf8").then(JSON.parse);
    const pLimit = await import("p-limit");
    const limit = pLimit.default(config.howManyAccountsRunInOneTime);
    const [datas, proxyList] = await Promise.all([fs.readFile("datas.txt", "utf8"), fs.readFile("proxies.txt", "utf8")]);
    const hivera = new HiveraAccount();
    await hivera.printBanner();
    const dataList = datas.split("\n").filter(Boolean);
    const proxyArray = proxyList.split("\n").filter(Boolean);
    proxies = [...proxyArray];
    proxyMap.clear();
    totalAccounts = dataList.length;
    const concurrency = config.howManyAccountsRunInOneTime;
    for (let i = 0; i < dataList.length; i += concurrency) {
      const dataChunk = dataList.slice(i, i + concurrency);
      await Promise.all(dataChunk.map((data, index) => {
        const proxy = proxyArray[i + index] || null;
        const account = new HiveraAccount(data, proxy, i + index + 1);
        return limit(() => account.main());
      }));
    }
    hivera.log();
    await hivera.countdown(config.timeToRestartAllAccounts);
    await start();
  } catch {
    console.log("Fuck scammers")
  }
}
