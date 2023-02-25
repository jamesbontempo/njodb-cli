#!/usr/bin/env node

const vm = require("vm");
const path = require("path");
const readline = require("readline");
const util = require("util");
const njodb = require("njodb");
const properties = require("./node_modules/njodb/package.json");

const methods = [
    "stats", "grow", "shrink", "resize", "drop",
    "insert", "insertFile", "select", "update", "delete", "aggregate"
];

const commands = ["exit", "details", "more", "last", "clear"];

var async = false;
var root = process.cwd();

var cmd = "";
var left = 0;
var right = 0;
var indent = 0;

var data = [];
var details = [];
var last = "";

const rl = readline.createInterface(
    {
        input: process.stdin,
        output: process.stdout,
        prompt: "njodb> "
    }
);

for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--root" && process.argv[i+1]) root = process.argv[i+1];
    if (process.argv[i] === "--async") async = true;
}

const context = {db: new njodb.Database(root)};
vm.createContext(context);

const format = (output) => {
    return util.inspect(output, {colors: true, depth: null, maxArrayLength: 10, compact: 5});
};

const clear = () => {
    cmd = "";
    data = [];
    indent = 0;
    rl.setPrompt("njodb> ");
}

console.log("Connected to the database at \x1b[33m%s\x1b[0m using \x1b[33m%s\x1b[0m", path.resolve(root), "njodb " + properties.version);
console.log("Available database methods (prepend with \x1b[36mdb.\x1b[0m and end with \x1b[36m;\x1b[0m\x1b[0m):\n\t\x1b[35m%s\x1b[0m", methods.sort().join(", "));
console.log("Additional commands:\n\t\x1b[35m%s\x1b[0m", commands.sort().join(", "))

rl.prompt();

rl.on("line", async (line) => {
    line = line.replace(/^\s+/, "");

    if(/^exit\s*$/.test(line)) {

        rl.close();

    } else if (/^details\s*$/.test(line)) {

        if (details && details.length > 0) {
            console.log(format(details));
            details = [];
        } else {
            console.log("There are no additional details to show");
        }

    } else if (/^more\s*$/.test(line)) {

        if (data && data.length > 0) {
            console.log(format(data));
            data.splice(0, 10);
        } else {
            console.log("There are no more results to show");
        }

    } else if (/^last\s*$/.test(line)) {

        if (last && last.length > 0) {
            last = last.replace(/(\n|\r|\t)+/g, " ");
            readline.moveCursor(process.stdin, last.length, 0, () => { rl.write(last); });
        } else {
            console.log("There is no last successful command to show");
        }

    } else if (/^clear\s*$/.test(line)) {

        clear();

    } else {

        cmd += line;

        left = [...cmd.matchAll(/(\(|\{)/g)].length;
        right = [...cmd.matchAll(/(\)|\})/g)].length;

        if ((right >= left) && /;$/.test(cmd)) {

            if (!/^\s*db\.\w+\s*\(.*\)/.test(cmd)) {

                console.error("Database method calls must begin with \"db.\"");
                clear();

            } else {

                const method = cmd.match(/^\s*db\.(\w+)\s*?\(/)[1];

                if (!methods.includes(method)) {

                    console.error(method + " is not a recorgnized command or method");
                    clear();

                } else {

                    try {

                        if (!async) cmd = cmd.replace(method, method + "Sync");

                        const script = new vm.Script(cmd);
                        const results = await script.runInContext(context);

                        details = results.details;
                        delete results.details;

                        if (/select|aggregate/.test(method)) {
                            if (Array.isArray(results.data)) {
                                data = results.data.slice(10);
                            } else if (Array.isArray(results)) {
                                data = results.slice(10);
                            } else {
                                data = [results].slice(10);
                            }
                        } else {
                            data = [];
                        }

                        console.log(format(results));

                        if (!async) last = cmd.replace(method + "Sync", method);

                        if (method === "drop") rl.close();

                    } catch (error) {

                        console.error(error.name + ": " + error.message);

                    } finally {

                        cmd = "";
                        indent = 0;

                    }

                }

            }

            rl.setPrompt("njodb> ");

        } else {

            rl.setPrompt(" ... > ");

        }

    }

    rl.prompt();

    if (/(\(|\{)$/.test(cmd)) indent++;
    if (/(\)|\})$/.test(cmd) && indent > 0) indent--;

    rl.write("  ".repeat(indent));
})

rl.on("error", (error) => {
    console.error(error);
    rl.prompt();
})

rl.on("close", () => {
    console.log("\x1b[36m%s\x1b[0m", "Later!");
    process.exit(0);
})