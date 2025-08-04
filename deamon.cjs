const { spawn } = require("child_process");

let childProcess;

function runDev() {
    childProcess = spawn("pnpm", ["dev"], {
        stdio: "inherit",
        shell: true,
    });

    childProcess.on("exit", (code) => {
        console.log(`\n\x1b[104m\x1b[30m DEAMON \x1b[0m Nuxt dev exited with code ${code}, restarting in 2s...\n`);
        setTimeout(runDev, 2000);
    });
}

// 捕捉 Ctrl+C / kill 命令
process.on("SIGINT", () => {
    console.log("\n\x1b[104m\x1b[30m DEAMON \x1b[0m Received SIGINT. Cleaning up...");
    if (childProcess) childProcess.kill("SIGINT");
    process.exit();
});

process.on("SIGTERM", () => {
    console.log("\n\x1b[104m\x1b[30m DEAMON \x1b[0m Received SIGTERM. Cleaning up...");
    if (childProcess) childProcess.kill("SIGTERM");
    process.exit();
});

runDev();
