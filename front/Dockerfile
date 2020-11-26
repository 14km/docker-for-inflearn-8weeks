# 빌드를 생성하는 내용이다.
FROM node:alpine as builder

WORKDIR /app
COPY ./package.json ./

RUN npm install
COPY . .
RUN npm run build

# nginx를 설정하는 내용.
FROM nginx
EXPOSE 3000

# 작성한 conf로 반영해줌.
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
# COPY로 빌드 완성된 내용으로 복사해준다.
COPY --from=builder /app/build  /usr/share/nginx/html
