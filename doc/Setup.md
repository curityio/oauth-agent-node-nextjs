# How to Run the OAuth Agent Locally

Follow the below steps to get set up for developing and testing the OAuth Agent itself.

## Prerequisites

Ensure that these tools are installed locally:

- [Node.js](https://nodejs.org/en/download/)
- [jq](https://stedolan.github.io/jq/download/)

## Build and Run the OAuth Agent

Run these commands from the root folder and the API will then listen on HTTP over port 3000:

```bash
npm install
npm run dev
```

Test that the API is contactable by running this command from the root folder:

```bash
curl -X POST http://localhost:3000/api/login/start \
-H "origin: http://www.example.local" | jq
```

## Run Integration Tests

Run some tests that require only a running OAuth Agent, with a mocked Identity Server:

```bash
npm run wiremock
npm test
```

## Running Docker

There is a Docker file that you can use to build and run the OAuth Agent without having to install any tools on your local machine — you only need Docker Desktop.

First, run this command from the root directory to build the Docker image:

```shell
docker build -t oauth-agent .
```

Then run the image with:

```shell
docker run -p 3000:3000 --rm oauth-agent
```
