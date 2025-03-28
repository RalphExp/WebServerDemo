#pragma once

#include <json-glib/json-glib.h>

#include "gst-webrtc-pipeline.h"
#include "gst-websocket-client.h"

class WebRTCMain : public WebsocketClientListener, WebRTCPipelineListener {
private:
  WebsocketClient *mClient;
  WebRTCPipeline *mPipeline;

  void startPipeline(bool master);
  void stopPipeline();
  void parseSdpAndIce(std::string& message);
  void parseSdp(JsonObject *data_json_object);
  void parseIce(JsonObject *data_json_object);

public:
  bool master_ = false;
  WebRTCMain();
  virtual ~WebRTCMain();

  void connectSignallingServer(std::string& url, std::string& origin);
  void disconnectSignallingServer();

  // WebsocketClientListener implements.
  virtual void onConnected(WebsocketClient *client);
  virtual void onDisconnected(WebsocketClient *client);
  virtual void onMessage(WebsocketClient *client, std::string& message);

  // WebRTCPipelineListener implements.
  virtual void onSendSdp(WebRTCPipeline *pipeline, gint type, gchar *sdp_string);
  virtual void onSendIceCandidate(WebRTCPipeline *pipeline, guint mlineindex, gchar *candidate);
  virtual void onAddStream(WebRTCPipeline *pipeline, GstPad *pad);
  virtual void onDataChannelConnected(WebRTCPipeline *pipeline);
  virtual void onDataChannelDisconnected(WebRTCPipeline *pipeline);
  virtual void onDataChannel(WebRTCPipeline *pipeline, std::string& message);
};
