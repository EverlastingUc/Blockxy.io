#include "voxel_compute.hpp"

extern "C" std::uint32_t blockxy_count_solid_neighbors(const std::uint8_t* occupancy) {
    if (occupancy == nullptr) return 0;

    std::uint32_t count = 0;
    for (std::uint32_t index = 0; index < 27; ++index) {
        if (index == 13) continue;
        count += occupancy[index] != 0 ? 1U : 0U;
    }
    return count;
}
