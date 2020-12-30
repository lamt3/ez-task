FROM node

WORKDIR /usr/app

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# for typescript
RUN npm run build
COPY ./env/production.env ./dist/
WORKDIR ./dist

EXPOSE 5000
CMD [ "npm", "run", "start" ]
