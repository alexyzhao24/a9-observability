const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
    getNodeAutoInstrumentations
} = require("@opentelemetry/auto-instrumentations-node");
const {
    ConsoleSpanExporter
} = require("@opentelemetry/sdk-trace-node");
const {
    ConsoleMetricExporter,
    PeriodicExportingMetricReader
} = require("@opentelemetry/sdk-metrics");
const {
    OTLPTraceExporter
} = require("@opentelemetry/exporter-trace-otlp-http");

const useJaeger = process.env.TRACE_EXPORTER === "jaeger";

const traceExporter = useJaeger
    ? new OTLPTraceExporter({
        url: "http://localhost:4318/v1/traces"
    })
    : new ConsoleSpanExporter();

const sdk = new NodeSDK({
    serviceName: "todo-service",

    traceExporter: traceExporter,

    metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
        exportIntervalMillis: 10000
    }),

    instrumentations: [
        getNodeAutoInstrumentations()
    ]
});

sdk.start();

console.log(
    useJaeger
        ? "OpenTelemetry traces exporting to Jaeger"
        : "OpenTelemetry traces exporting to console"
);