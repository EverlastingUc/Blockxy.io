//! Deterministic, renderer-independent world primitives for Blockxy.io.

/// Integer coordinate of a voxel in the world grid.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct VoxelPos {
    pub x: i32,
    pub y: i32,
    pub z: i32,
}

impl VoxelPos {
    pub const fn new(x: i32, y: i32, z: i32) -> Self {
        Self { x, y, z }
    }

    /// Returns the six axis-aligned neighboring voxel positions.
    pub fn neighbors(self) -> [Self; 6] {
        [
            Self::new(self.x + 1, self.y, self.z),
            Self::new(self.x - 1, self.y, self.z),
            Self::new(self.x, self.y + 1, self.z),
            Self::new(self.x, self.y - 1, self.z),
            Self::new(self.x, self.y, self.z + 1),
            Self::new(self.x, self.y, self.z - 1),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn voxel_has_six_neighbors() {
        let neighbors = VoxelPos::new(0, 0, 0).neighbors();
        assert_eq!(neighbors.len(), 6);
        assert!(neighbors.contains(&VoxelPos::new(1, 0, 0)));
        assert!(neighbors.contains(&VoxelPos::new(0, -1, 0)));
    }
}
