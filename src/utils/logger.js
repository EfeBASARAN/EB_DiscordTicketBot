class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    formatTime() {
        const now = new Date();
        return now.toLocaleString('tr-TR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    info(message) {
        console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.green}INFO${this.colors.reset} ${message}`);
    }

    success(message) {
        console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.green}✅ SUCCESS${this.colors.reset} ${message}`);
    }

    warn(message) {
        console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.yellow}⚠️  WARN${this.colors.reset} ${message}`);
    }

    error(message) {
        console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.red}❌ ERROR${this.colors.reset} ${message}`);
    }

    debug(message) {
        // Debug mesajları sadece DEBUG_MODE aktifse gösterilsin
        if (process.env.DEBUG_MODE === 'true' || global.DEBUG_MODE) {
            console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.magenta}🔍 DEBUG${this.colors.reset} ${message}`);
        }
    }

    bot(message) {
        console.log(`${this.colors.cyan}[${this.formatTime()}]${this.colors.reset} ${this.colors.blue}🤖 BOT${this.colors.reset} ${message}`);
    }
}

module.exports = new Logger();

