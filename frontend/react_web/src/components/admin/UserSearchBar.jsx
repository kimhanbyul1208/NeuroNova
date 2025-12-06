import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, InputAdornment, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

/**
 * 사용자 검색 바 컴포넌트
 * 검색어 입력 및 검색 버튼 제공
 */
const UserSearchBar = ({ searchTerm, onSearchTermChange, onSearch }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <Box
            sx={{ display: 'flex', gap: 1, mb: 3 }}
            className="user-search-bar"
            role="search"
            aria-label="사용자 검색"
        >
            <TextField
                fullWidth
                placeholder="사용자명, 이메일, 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyDown={handleKeyDown}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                    sx: { borderRadius: '12px', bgcolor: 'white' }
                }}
                size="small"
                className="user-search-input"
                aria-label="사용자 검색어 입력"
                inputProps={{
                    'aria-describedby': 'search-help-text'
                }}
            />
            <Button
                variant="contained"
                onClick={onSearch}
                startIcon={<SearchIcon />}
                sx={{ minWidth: 100, borderRadius: '12px' }}
                className="user-search-button"
                aria-label="검색 실행"
            >
                검색
            </Button>
        </Box>
    );
};

UserSearchBar.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    onSearchTermChange: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired
};

export default UserSearchBar;
