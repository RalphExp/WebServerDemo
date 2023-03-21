import os

# mysql user name
USER = 'root'

PORT = 3306

# mysql password
PASSWORD = 'root'

# mysql database name
DATABASE ='test'

# http port the server listens on
HTTP_PORT = 8080

# avantage api key
AVANTAGE_KEY = 'fake_key'

if os.environ.get('env') == 'prod':
    print('production environment')

    import prod_key
    AVANTAGE_KEY = prod_key.AVANTAGE_KEY
    HOST = prod_key.HOST
else:
    print('test environment')

    import test_key
    AVANTAGE_KEY = test_key.AVANTAGE_KEY
    HOST = test_key.HOST


