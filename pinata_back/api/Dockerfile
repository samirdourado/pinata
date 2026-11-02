# syntax=docker/dockerfile:1
# Pinata API. Build context: pinata_back/ (the Cargo workspace), see compose.yaml.

# Same Rust version as rust-toolchain.toml
FROM rust:1.89-slim-bookworm AS builder
RUN apt-get update && apt-get install -y --no-install-recommends pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
# Cache mounts keep downloaded crates and compiled dependencies between builds
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/app/target \
    cargo build --release -p pinata-api \
    && cp target/release/pinata-api /usr/local/bin/pinata-api

FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/bin/pinata-api /usr/local/bin/pinata-api
USER nobody
EXPOSE 8080
CMD ["pinata-api"]
