#pragma once

#include <cstdint>

extern "C" {
/// Counts solid neighbors around one voxel in a 3x3x3 occupancy buffer.
/// Buffer layout is x + 3*y + 9*z; the center cell is ignored.
std::uint32_t blockxy_count_solid_neighbors(const std::uint8_t* occupancy);
}
