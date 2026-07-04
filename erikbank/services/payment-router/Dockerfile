FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod .
COPY main.go .
RUN go build -o payment-router .

FROM alpine:3.20
WORKDIR /app
COPY --from=build /app/payment-router .
EXPOSE 8082
ENTRYPOINT ["./payment-router"]
