cmake_minimum_required(VERSION 3.20)
project(blockxy_voxel_compute LANGUAGES CXX)

add_library(blockxy_voxel_compute STATIC src/voxel_compute.cpp)
target_compile_features(blockxy_voxel_compute PUBLIC cxx_std_20)
target_include_directories(blockxy_voxel_compute PUBLIC include)

if(EMSCRIPTEN)
  set_target_properties(blockxy_voxel_compute PROPERTIES SUFFIX ".wasm")
  target_link_options(blockxy_voxel_compute PRIVATE
    "-sSTANDALONE_WASM=1"
    "-sEXPORTED_FUNCTIONS=['_blockxy_count_solid_neighbors']"
  )
endif()
