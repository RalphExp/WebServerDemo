package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()
	router.GET("/", func(c *gin.Context) { c.File("./static/index.html") })
	router.GET("/constrain", func(c *gin.Context) { c.File("./static/constrain.html") })

	router.Static("/js", "./static/js")
	router.Run(":8000")
}
