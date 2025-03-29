cmake_minimum_required(VERSION 3.10)

project(gst-webrtc-sample C CXX)

find_package(PkgConfig)

pkg_check_modules(LIBSOUP REQUIRED libsoup-2.4)

pkg_check_modules(GSTREAMER_WEBRTC REQUIRED gstreamer-webrtc-1.0)

pkg_check_modules(GSTREAMER REQUIRED
  glib-2.0
  json-glib-1.0
  libsoup-2.4
  gstreamer-1.0
  gstreamer-sdp-1.0
  gstreamer-webrtc-1.0)

message("GSTREAMER_INCLUDE_DIRS: ${GSTREAMER_INCLUDE_DIRS}")

message("GSTREAMER_LIBRARY_DIRS: ${GSTREAMER_LIBRARY_DIRS}")

link_directories(${GSTREAMER_LIBRARY_DIRS})

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Debug)
endif()

set(CMAKE_C_FLAGS "-g -Wall")
set(CMAKE_C_FLAGS_DEBUG "-g -O0 -pg")
set(CMAKE_C_FLAGS_RELEASE "-O2 -s -DNDEBUG -march=native")
set(CMAKE_C_FLAGS_RELWITHDEBINFO "-g -Og -pg")
set(CMAKE_C_FLAGS_MINSIZEREL "-Os -s DNDEBUG -march=native")

set(CMAKE_CXX_FLAGS "-g -Wall -std=c++17")
set(CMAKE_CXX_FLAGS_DEBUG "-g -DDEBUG_BUILD")
set(CMAKE_CXX_FLAGS_RELEASE "-O2 -s -DNDEBUG -march=native")
set(CMAKE_CXX_FLAGS_RELWITHDEBINFO "-O3 -Og -pg")
set(CMAKE_CXX_FLAGS_MINSIZEREL "-Os -s DNDEBUG -march=native")

add_executable(gst-webrtc-sample
  src/gst-webrtc-data-channel.cc
  src/gst-webrtc-main.cc
  src/gst-webrtc-pipeline.cc
  src/gst-websocket-client.cc
  src/main.cc)

target_include_directories(gst-webrtc-sample  PUBLIC ${GSTREAMER_INCLUDE_DIRS})

target_link_libraries(gst-webrtc-sample  ${GSTREAMER_LIBRARIES})
target_link_libraries(gst-webrtc-sample  pthread)

target_compile_options(gst-webrtc-sample  PUBLIC ${GSTREAMER_CFLAGS_OTHER})
