if [ ! -e cert ]; then 
    mkdir certs;
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/localhost.key -out certs/localhost.crt