[노션 링크 추가](https://www.notion.so/connor2doc/b92fc77b41764b239d63dd6dee7055a5)

---

# API 서버를 설계하자.

## api server를 위한 package.js 만들기.

```jsx
{
  "name": "api-service",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
		"start": "node server.js",
		"dev": "nodemon server.js"
  },
	"dependencies": {
    "express": "^4.17.1",
    "mysql": "^2.18.1",
    "nodemon": "^2.0.6",
    "body-parser": "^1.19.0"
  },
  "author": "",
  "license": "ISC"
}
```

- scripts →  js 스크립트를 실행하기 위한 내용 ( 명령어를 생성할 수 있다)
- dependencies → 패키지별 의존성을 설치하는 부분.

## Server.js 파일을 만들어서 이용하자!

```jsx
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

// express 실행.
const app = express();

// 요청의 json을 파싱하는 방법
app.use(bodyParser.json());

db.pool.query(`CREATE TABLE lists (
        id INTEGER AUTO_INCREMENT,
        value TEXT,
        PRIMARY KEY (id)
)`, (err, results, fileds) => {
  console.log('results', results);
});

// 요청을 SQL Select
app.get('/api/values', function(req, res) {
  db.pool.query(`select * from lists`,
      (err, results, fileds) => {
        if (err) {
          return res.status(500).send(err);
        }
        return res.json(results);
      });
});

// 요청을 SQL create
app.post('/api/value', function(req, res, next) {
  db.pool.query(`INSERT INTO lists (value) VALUES ("${req.body.value}")`,
      (err, result, fileds) => {
        if (err) {
          return res.status(500).send(err);
        }

        return res.json({
          success: true,
          value: req.body.value,
        });
      });
});

app.listen(5000, () => {
  console.log('App에서 5000번 포트를 사용하여 실행한다.');
});
```

---

## React 를 구현하자!

```jsx
import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

function App() {

  useEffect(() => {
    axios.get('/api/hi').then(response => {
      console.log('response', response);
    });
  }, []);
  
  // api call을 미리 가져올 수 있게한다.
  useEffect(() => {
    axios.get('/api/values').then(response => {
      console.log('response', response);
      setLists(response.data);
    });
  }, []);

  const [lists, setLists] = useState([]);
  const [value, setValue] = useState('');

	// 이벤트가 발생될 때 마다 changeHandler를 호출한다.
  const changeHandler = (event) => {
    setValue(event.currentTarget.value);
  };

	// submit이 진행될 사용될 때 호출된다.
  const submitHandler = (event) => {
		// 기존에 사용하던 이벤트를 없앤다.
    event.preventDefault();

    axios.post('/api/value', {value: value}).then(response => {
      if (response.data.success) {
        console.log('response', response);
        setLists([...lists, response.data]);
        setValue('');
      }
      else {
        alert('값을 DB에 넣는데 실패했습니다.');
      }
    });
  };

  return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <div className="container">
					
            {lists && lists.map((list, index) => (
                <li key={index}>{list.value} </li>
            ))}
            <br/>
            안녕하세요.
            <form className="example" onSubmit={submitHandler}>
              <input
                  type="text"
                  placeholder="입력해주세요..."
                  onChange={changeHandler}
                  value={value}
              />
              <button type="submit">확인.</button>
            </form>
          </div>
        </header>
      </div>
  );
}

export default App;
```

- useState → useState를 사용하기 위해서 react 라이브러리에서 호출
- lists → database 에 저장된 값을 가져오기 위함
- value → input 박스에 입력한 값이 state에 들어감
- useEffect → useState를 사용하기 위해서 react 라이브러리에서 가져옴.
- changeHandler → 메서드를 생성하여 value를 변경해준다.

---

# 도커 파일을 설정하자!

```docker
# dev docker
FROM node:alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY ./ ./

CMD [ "npm", "run", "start" ]

...

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

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build  /usr/share/nginx/html
```

- 운영 환경은 빌드 파일을 생성하여 사용한다.
- `COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf` nginx의 기본 설정 파일.

    → 해당 파일을 복사하여 nginx를 이용하여 빌드 할 수 있다.

## Nginx 를 설계 하는 방법

- 해당 설정을 할 수 있도록 nignx의 설정을 진행 해줘야 한다. `default.conf`
- nginx 디렉토리에 `default.conf` 파일을 추가해야한다.

```docker
server {
		# 3000번 포트로 수신.
    listen 3000;
		# 해당 / 로 들어왔을때 .. 아래의 uri를 실행.
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri  $uri/ /index.html;
    }
}
```

# Elastic Beanstalk

→ DB는 EB은 들어갈 필요가 없다.
→ 롤링 배포를 하지 않아도 되기 때문에.

---

# Mysql DB Setting..

```docker
FROM mysql:5.7

ADD ./db.conf /etc/mysql/conf.d/my.conf

...

#db.conf
[mysqld]
character-set-server=utf8

[mysql]
default-character-set=utf8

[client]
default-character-set=utf8

#initialize.sql
DROP DATABASE IF EXISTS myapp;

CREATE DATABASE myapp;
USE myapp;

CREATE TABLE lists (
    id INTEGER AUTO_INCREMENT,
    value TEXT,
    PRIMARY KEY (id)
);
```

→ 기존에 SQL을 파일로 만들어서 실행시킨다.

---

# Nginx Proxy를 사용

- 위의 설정이 경우.. 현재 API와 페이지를 호출하는데 각기 다른 방식으로 사용되고 있다.
- Nginx 프록시를 이용하여 해당 요청들을 처리할 수 있다.

→ URL의 요청 사항에 따라 변경이 가능하다.

1. `${Host}/static/js/main.js`
2. `${Host}/api/value` 

## default.conf 파일 작성하기.

```bash

# frontend 라는 서비스는 3000번 포트를 사용하고 있다 명시.
upstream frontend {
		# docker-compose의 서비스 이름이다.
    server frontend:3000;
}

# backend 라는 서비스는 5000번 포트를 사용하고 있다 명시.
upstream backend {
		# docker-compose의 서비스 이름이다.
    server backend:5000;
}

server {
		# 80번 포트로 열려있게 된다.
    listen 80;

		# 사용하는 부분을 분기 -> 즉, 프론트 영역으로 해준다.
		# location의 경우 /에 우선순위가 가장 낮다.
    location / {
        proxy_pass http://frontend;
    }

		# 사용하는 부분을 분기 -> 즉, 백엔드 영역으로 해준다.
    location /api {
        proxy_pass http://backend;
    }

		# react를 할떄, 없으면 에러가 발생한다.
    location /sockjs-node {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }

}
```

## Dockerfile 작성!

```bash
FROM nginx

COPY ./default.conf /etc/nginx/conf.d/default.conf
```

---

# Docker Compose 생성!

```bash
version: "3"
services:
  front:
		# 빌드를 하기 위함.
    build:
      dockerfile: Dockerfile.dev
      context: ./front
		# react 종료시 버그에 대응하기 위함.
    stdin_open: true
		# 빌드한 파일이 반영될 수 있도록 하는 작업.
		volumes:
	    - /app/node_modules
	    - ./front:app

	nginx:
    # 재시작 정책이다.
    restart: always
    build:
      context: ./nginx
      dockerfile: Dockerfile
		ports:
      - "3000:80"

	api:
    build:
      context: ./api
      dockerfile: Dockerfile.dev
    container_name: app_api
    volumes:
      - /app/node_moudules
      - ./api:/app

  mysql:
    build:
      context: ./mysql
      dockerfile: Dockerfile
    container_name: app_mysql
    restart: unless-stopped
    ports:
      - "3306": "3306"
    volumes:
      - ./mysql/mysql_data:/var/lib/mysql
      - ./mysql/sqls/:/docker-entrypoint-initdb.d/
    environment:
      MYSQL_HOST: mysql
      MYSQL_USER: root
      MYSQL_ROOT_PASSWORD: connor
      MYSQL_DATABASE: app
      MYSQL_PORT: 3306
```

## nginx

- 옵션중 restart 는 nginx가 오류가 발생되어 실행이 되지 않는 경우 사용한다.
    - no : restart를 하지않는다.
    - always : 항상 재시작을 한다.
    - on-failure : on-failure코드와 함께 컨테이너가 멈추었을때만 재시작한다.
    - unless-stopped : 개발자가 임의로 멈추지않는 경우를 제외하고 재시작.

## mysql

- volumes에 저장하여 데이터가 남아있을 수 있도록 해야한다.
- 컨테이너를 원래 지우면 같이 지워지는데.. 볼륨을 이어주면 지어지지 않는다.
- 아래의 그림처럼 파일 자체를 호스트 파일 시스템에 저장하는 것이다.

- docker-compose의 파일내 작성했던 DB는 제거한다.
→ 그래야 정상적으로 AWS RDB에 접근하도록 한다.

---

# Travis.yml file 작성해보자!

1. 파일을 생성한다.  `.travis.yml`
2. `.travis.yml` 환경에 따라서 테스트 코드를 빌드 할 수 있도록 설정 할 수 있다.

    → before_install : 인스톨이 하기전 테스트를 하기 위함.
    → after_success : 정상적으로 이전 작업이 완성 되었다면.  

```bash
language: generic

sudo: required

services:
  - docker

before_install:
  - docker build -t connor/react-app -f ./frontend/Dockerfile.dev ./frontend

script:
  - docker run -e CI=true connor/react-app npm test

after_success:
  - docker build -t connor/docker-frontend ./frontend
  - docker build -t connor/docker-backend ./backend
  - docker build -t connor/docker-nginx ./nginx

  - echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_ID" --password-stdin

  - docker push connor/docker-frontend
  - docker push connor/docker-backend
  - docker push connor/docker-nginx

deploy:
  provider: elasticbeanstalk
  region: "ap-northeast-2"
  app: "docker-fullstack-app"
  env: "DockerFullstackApp-env"
  bucket_name: elasticbeanstalk-ap-northeast-2-972153559337
  bucket_path: "docker-fullstack-app"
  on:
    branch: master

  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_ACCESS_KEY
```

---

# DockerRun.aws.json

- Elastic Beanstalk에 관한 컨테이너 설정이 담긴 파일이다.
- 프로세스를 관련된 설정을 해줘야 한다.

### AWS - Task Definition(작업정의) 지정목록

- 작업의 각 컨테이너에 사용할 도커 이미지
- 각 작업 또는 작업 내 각 컨테이너에서 사용할 CPU 및 메모리의 양
- 사용할 시작 유형으로서 해당 작업이 호스팅되는 인프라를 결정
- 작업의 컨테이너에 사용할 도커 네트워킹 모드
- 작업에 사용할 로깅 구성
- 컨테이너 종료 또는 실패하더라도 작업이 계속 실행될지 여부
- 컨테이너 시작 시 컨테이너가 실행할 명령
- 작업의 컨테이너에서 사용할 데이터 볼륨
- 작업에서 사용해야 하는 IAM 역할

⇒ 관련 내용이 정의 되어 있어야 한다.

### containerDefinitions

```bash
{
  "AWSEBDockerrunVersion": 2,
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "connor/docker-frontend",
      "hostname": "frontend",
      "essential": false,
      "memory": 128
    },
    {
      "name": "backend",
      "image": "connor/docker-backend",
      "hostname": "backend",
      "essential": false,
      "memory": 128
    },
    {
      "name": "nginx",
      "image": "connor/docker-nginx",
      "hostname": "nginx",
      "essential": true,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80
        }
      ],
      "links": [
        "frontend",
        "backend"
      ],
      "memory": 128
    }
  ]
}
```

→ hostname : 다른 컨테이너에 이름에서 접근이 가능하도록 한다.

→ name : 이름

→ image : dockerhub에 등록 되어있는 이름을 지정하는것.

→ essential : 컨테이너가 실행에 실패하면 다른 작업을 중지할 것인가.

→ memory : 사용할 메모리

→ portMappings : 어디 포트에서 어디 포트로 나갈 것인지.. 

→ links : 연결할 컨테이너의 목록이다. (어디에서 연결이 될 것인지)

---

## VPC를 이용하여 RDS에 연결하자.

- EB와 RDS에 연결을 하여야 정상적으로 사용이 가능하다. (통신)
- EB 인스턴스나 RDB를 생성하면 자동적으로 기본 VPC가 할당 된다.

### VPC란 무엇인가?

- 아마존의 Virtual Private Cloude(VPC)를 사용하면 AWS 클라우드에서 논리적으로 격리된 공간을 프로비저닝하여 고객이 정의하는 가상 네트워크에서 AWS 리소스를 시작할 수 있습니다.
- 즉, EC2 혹은 EB 인스턴스를 RDB 데이터 베이스에 맞게 만들어 접근하게 하여 격리된 네트워크를 구현하는 것이다.

### Security Group(보안 그룹)이 무엇인지 알아보자.

- EC2 인스턴스, EB 인스턴스 등등 Security Group를 통하여 인바운드, 아웃바운드 요청을 조절 할 수 있다.

→ 인바운드 : HTTP, HTTPS, SSH  등이 존재한다.

→ 아웃바운드 : EC2 인스턴스나 EB인스턴스 등이 외부로 나가는 트래픽이다.

- 즉, 해당 설졍을 통하여 트래픽을 통제하여 열어줄 수 있고 닫을 수 도 있다.

---

## Security Group 생성하기

- VPC 내에 Security Group를 설정하여 통신이 가능하도록 해야한다.
- VPC → 보안그룹 → 생성 후 인바운드, 아웃바운드를 설정한다.

    → 통신할 포트를 열어준다. EX: 3306, 80 ...

## Security Group 적용하기

- RDS에 보안그룹을 추가하면 된다.
- EB에서도 보안 그룹을 추가해준다.

→ 즉, EB에서 RDB로 접근이 가능하도록 변경이 된다.

## 엘라스틱 빈즈토크 환경변수 적용

- 환경변수를 적용해줘야 한다. → 그래야 사용이 가능함.
- 인스턴스가 새로 생성 또는 배포를 할때 기존 환경변수를 통하여 배포되기 때문이다.

## 마지막으로 travis.yml 파일 작성해보기.

```bash
language: generic

sudo: required

services:
  - docker

# 설치 하기전에 확인하기
before_install:
  - docker build -t connor/react-app -f ./frontend/Dockerfile.dev ./frontend

# test 스크립트를 실행하여 검증한다.
script:
  - docker run -e CI=true connor/react-app npm test

after_success:
  - docker build -t connor/docker-frontend ./frontend
  - docker build -t connor/docker-backend ./backend
  - docker build -t connor/docker-nginx ./nginx

  - echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_ID" --password-stdin

  - docker push connor/docker-frontend
  - docker push connor/docker-backend
  - docker push connor/docker-nginx

deploy:
  provider: elasticbeanstalk
  region: "ap-northeast-2"
  app: "docker-fullstack-app"
  env: "DockerFullstackApp-env"
  bucket_name: elasticbeanstalk-ap-northeast-2-972153559337
  bucket_path: "docker-fullstack-app"
  on:
    branch: master

  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_ACCESS_KEY
```

→ provider : 어떠한 deploy를 사용하는 것인지. 

→ region : 어떠한 AWS의 리전을 사용하는지.

→ app : 어플리케이션의 이름

→ env : 환경 변수를 저장되어 있는 정보

→ bucket_name : S3 버켓이름 → 저장하는 이유는 도커 파일을 저장하여 태깅하기 위함.

→ bucket_path : 버켓 경로

→ on : 어떠한 행위(작업)이 일어났을 때 대응할 것 인지를 명시하는 내용이다.
