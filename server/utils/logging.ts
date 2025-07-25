import { random } from "lodash-es";

class LoggingFactory {
    private static instance: LoggingFactory;
    private static grouping_record = new Map<number, string>();

    private readonly LEVELS: Record<string, number> = {
        TRACE: 0,
        DEBUG: 1,
        INFO: 2,
        WARNING: 3,
        ERROR: 4,
        FATAL: 5,
    };

    private readonly TAGS: Record<number, string> = {
        0: "TRA",
        1: "DBG",
        2: "INF",
        3: "WRN",
        4: "ERR",
        5: "FTL",
    };

    private readonly COLORS: Record<number, string> = {
        0: "\x1b[90m", // 灰色
        1: "\x1b[34m", // 蓝色
        2: "\x1b[32m", // 绿色
        3: "\x1b[33m", // 黄色
        4: "\x1b[31m", // 红色
        5: "\x1b[91m", // 深红色
    };

    private readonly RESET = "\x1b[0m";

    private readonly minLevel: number;

    private constructor() {
        const levelName = (process.env.LOG_LEVEL || "INFO").toUpperCase();
        this.minLevel = this.LEVELS[levelName as keyof typeof this.LEVELS] ?? 2;
    }

    public static getInstance(): LoggingFactory {
        if (!LoggingFactory.instance) {
            LoggingFactory.instance = new LoggingFactory();
        }
        return LoggingFactory.instance;
    }

    public trace(msg: string, id: number): void {
        this.log(0, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public debug(msg: string, id: number): void {
        this.log(1, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public info(msg: string, id: number): void {
        this.log(2, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public warning(msg: string, id: number): void {
        this.log(3, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public error(msg: string, id: number): void {
        this.log(4, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public fatal(msg: string, id: number): void {
        this.log(5, msg, LoggingFactory.grouping_record.get(id) ?? "");
    }

    public createJob(job_name: string): number {
        const id = random(9999);
        LoggingFactory.grouping_record.set(id, job_name);
        return id;
    }

    public deleteGroup(id: number): void {
        LoggingFactory.grouping_record.delete(id);
    }

    private shouldLog(level: number): boolean {
        return level >= this.minLevel;
    }

    private getTimestamp(): string {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `[${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
            now.getSeconds()
        )}]`;
    }

    private log(level: number, message: string, group?: string): void {
        if (!this.shouldLog(level)) return;
        const color = this.COLORS[level] || "";
        const tag = this.TAGS[level];
        const timestamp = this.getTimestamp();
        const groupPart = group ? `[${group}] ` : "";
        console.log(`${color}${timestamp} [${tag}]${this.RESET} ${groupPart}${message}`);
    }
}

export default LoggingFactory.getInstance();
