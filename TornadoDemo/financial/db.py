import json
import datetime
import pymysql.cursors
import config

def getConnection():
    return pymysql.connect(
            host=config.HOST,
            port=config.PORT,
            user=config.USER,
            password=config.PASSWORD,
            database=config.DATABASE,
            autocommit=True,
            cursorclass=pymysql.cursors.DictCursor
        )


def sqlConn(func):
    """ use a decorator to make connection easier to use
    """
    def __sqlFunc(*args):
        conn = None
        cursor = None
        try:
            conn = getConnection()
            cursor = conn.cursor()
            return func(*args, cursor=cursor)
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    return __sqlFunc


@sqlConn
def getFinancialData(symbol, startDate, endDate, page, limit, **kwargs):
    """ fetch financial from db
    """
    sql = f"SELECT symbol, date, open_price, close_price, volume FROM Financial " + \
        f"WHERE date >= '{startDate}' AND " + \
        f"date <= '{endDate}' AND symbol = '{symbol}' LIMIT {(page-1) * limit}, {limit};"

    # print(sql)
    cursor = kwargs.get('cursor')
    cursor.execute(sql)
    rows = cursor.fetchall()
    return rows


@sqlConn
def getPaginationData(symbol, startDate, endDate, page, limit, **kwargs):
    """ get pagination information
    """
    sql = f"SELECT COUNT(*) AS cnt FROM Financial WHERE date >= '{startDate}' " + \
        f"AND date <= '{endDate}' AND symbol = '{symbol}';"
    
    # print(sql)
    cursor = kwargs.get('cursor')
    cursor.execute(sql)
    c = cursor.fetchone()

    return {
        'count': c['cnt'],
        'page': page,
        'limit': limit,
        'pages': (c['cnt'] + limit - 1) // limit
    }


@sqlConn
def initDatabase(**kwargs):
    sql = """
        CREATE TABLE IF NOT EXISTS Financial(
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        symbol VARCHAR(255) NOT NULL,
        `date` VARCHAR(16) NOT NULL,
        open_price VARCHAR(255) NOT NULL,
        close_price VARCHAR(255) NOT NULL,
        volume VARCHAR(255) NOT NULL,
        UNIQUE(symbol, `date`)
    );
    """

    cursor = kwargs.get('cursor')
    cursor.execute(sql)


@sqlConn
def updateFinancialData(symbol, data, **kwargs):
    """ save data to db
    @return 0: success, other: failure
    """

    # use ignore, so the insert will ignore those duplicated key
    sql = "INSERT IGNORE INTO Financial (symbol, date, open_price, close_price, volume) VALUES "

    i = 1
    for date, fields in data.items():
        sql += "('%s', '%s', '%s', '%s', '%s')" % \
            (symbol, date, fields['1. open'], fields['4. close'], fields['6. volume'])
        
        if i < len(data):
            sql += ","
        
        i += 1
    
    cursor = kwargs.get('cursor')
    cursor.execute(sql)
    print(f'update {symbol} count: {cursor.rowcount}')
    return cursor.rowcount


@sqlConn
def getStatisticsData(symbol, startDate, endDate, **kwargs):
    """ get the average value of the given peroid
    """

    sql = f"SELECT AVG(open_price) AS avg_open, AVG(close_price) AS avg_close, AVG(volume) " + \
        f"AS avg_volume FROM Financial WHERE date >= '{startDate}' " + \
        f"AND date <= '{endDate}' AND symbol = '{symbol}';"
    
    # print(sql)
    cursor = kwargs.get('cursor')
    cursor.execute(sql)
    statistics = cursor.fetchone()

    # print(statistics)
    return statistics
