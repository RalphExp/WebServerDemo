
# returns blank data
curl -v 'http://localhost:8080/v1/financial'

# IBM data, page=1, limit=1000
curl -v 'http://localhost:8080/v1/financial?start_date=2023-01-01'

# day error
curl -v 'http://localhost:8080/v1/financial?start_date=2023-01-32'

# month error
curl -v 'http://localhost:8080/v1/financial?start_date=2023-13-02'

# start day greater than end date
curl -v 'http://localhost:8080/v1/financial?start_date=2023-01-01&end_date=2022-12-31'

# symbol not support
curl -v 'http://localhost:8080/v1/financial?start_date=2023-02-02&end_date=2023-02-02&symbol=TSCO'

# statistics
curl -v 'http://localhost:8080/v1/statistics?start_date=2023-01-01&end_date=2023-02-01'

# nodata
curl -v 'http://localhost:8080/v1/statistics'

# page & limit
curl -v 'http://localhost:8080/v1/financial?start_date=2022-01-01&page=10&limit=50'
