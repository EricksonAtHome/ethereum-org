FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /tracking .

FROM alpine:3.19
WORKDIR /app
COPY --from=build /tracking .
EXPOSE 8081
CMD ["./tracking"]
