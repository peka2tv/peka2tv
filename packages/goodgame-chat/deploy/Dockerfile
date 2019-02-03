FROM debian:jessie-slim

WORKDIR /root

COPY dist/goodgame-chat ./goodgame-chat
COPY dist/config.env.json ./config.env.json

ENTRYPOINT [ "/root/goodgame-chat" ]
