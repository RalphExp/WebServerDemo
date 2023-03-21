FROM ubuntu:18.04

RUN apt-get update

RUN apt-get -y install python3
RUN apt-get -y install python3-pip
RUN apt-get -y install vim

RUN pip3 install --upgrade pip

WORKDIR /root/pyweb

COPY requirements.txt requirements.txt

RUN pip3 install -r requirements.txt

COPY financial financial
COPY config.py config.py
COPY test_key.py test_key.py
COPY prod_key.py prod_key.py
COPY get_raw_data.py get_raw_data.py

WORKDIR /root/pyweb/financial

CMD [ "env=prod; python3 server.py" ]

EXPOSE 8080
