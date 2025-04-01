FROM ubuntu:focal

RUN apt-get update && \
        apt-get install -y curl gnupg curl
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor
RUN echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 
RUN apt-get update && \
        apt-get install -y mongodb-org mongodb-org-mongos mongodb-org-server \
            mongodb-org-tools mongodb-org-database \
            mongodb-org-database-tools-extra mongodb-org-shell \
	    nodejs

COPY ./script /script
WORKDIR /script
RUN npm install

CMD ["npm", "start"]
