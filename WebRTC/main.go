package main

import (
	"github.com/gin-gonic/gin"
)

func handleRoot(c *gin.Context) {
	c.File("./static/index.html")
}

func handleWebRTC(c *gin.Context) {
	param := c.Param("path")
	c.File("./static/" + param + ".html")
}

func main() {
	router := gin.Default()
	group := router.Group("/webrtc")
	group.GET("/:path", handleWebRTC)

	router.GET("/", handleRoot)
	router.Static("/js", "./js")
	router.Static("/socket.io", "./socket.io")

	router.Run(":8000")
}
