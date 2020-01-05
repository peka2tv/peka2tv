FROM debian:jessie-slim

WORKDIR /root

COPY dist/thirdparty-smiles ./thirdparty-smiles
COPY dist/config.env.json ./config.env.json

ENTRYPOINT [ "/root/thirdparty-smiles" ]
