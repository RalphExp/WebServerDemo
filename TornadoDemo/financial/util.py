import re
import json

valid_days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

class ParameterError(Exception):
    pass


def loadJson(financialData):
    """ transform the json into python object
    """
    data = json.loads(financialData)
    # print(data)

    return data['Time Series (Daily)']


def dumpFinancialJson(finalcialData, pageData):
    js = {
        'data': [],
        'pagination': pageData,
        'info': {'error': ''}
    }

    for row in finalcialData:
        js['data'].append(row)
    
    return json.dumps(js)


def dumpFinancialError(err):
    js = {
        'data': [],
        'pagination': {},
        'info': {'error': err}
    }
    return json.dumps(js)


def dumpStatisticsJson(statisticsData, startDate, endDate):
    js = {
        'data': {
            'start_date': startDate,
            'end_date': endDate,
        },
        'info': {'error': ''}
    }

    if statisticsData['avg_open'] is not None:
        js['data']['average_daily_open_price'] = round(statisticsData['avg_open'], 2)
        js['average_daily_close_price'] = round(statisticsData['avg_close'], 2)
        js['average_daily_volume'] = round(statisticsData['avg_volume'], 2)
    else:
        js['info']['error'] = 'No data'
    return json.dumps(js)


def dumpStatisticsError(err):
    js = {
        'data': [],
        'info': {'error': err}
    }
    return json.dumps(js)


def validateDate(date) -> None:
    match = re.match(r'(\d{4})-(\d{2})-(\d{2})', date)

    if match is None:
        raise ParameterError('date format error')
    
    year = int(match.group(1))
    mon = int(match.group(2))
    day = int(match.group(3))

    leapYear = year % 400 == 0 or (year % 4 == 0 and year % 100 != 0)
    if mon < 1 or mon > 12:
        raise ParameterError('month error')
    
    if day < 1 or day > valid_days[mon-1]:
        raise ParameterError('day error')
    
    if mon == 2 and day == 29 and leapYear == False:
        raise ParameterError('day error')
    
    return


def validatePage(page):
    """ page should be an interger 
    """

    match = re.match(r'[^0]\d*', page)
    if not match:
        raise ParameterError('page format error')
    
    if len(page) > 10:
        raise ParameterError('page too large')
    
    return int(page)


def validateLimit(limit):
    match = re.match(r'[^0]\d{0,2}|1000', limit)
    if not match:
        raise ParameterError('limit error should be 1~1000')
        
    return int(limit)
