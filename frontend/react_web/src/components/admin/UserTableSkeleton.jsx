import React from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton
} from '@mui/material';

/**
 * 사용자 테이블 스켈레톤 로딩 컴포넌트
 * 데이터 로딩 중 표시되는 플레이스홀더
 */
const UserTableSkeleton = ({ rows = 5 }) => {
    return (
        <TableContainer className="user-table-skeleton">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>사용자명</strong></TableCell>
                        <TableCell><strong>이메일</strong></TableCell>
                        <TableCell><strong>이름</strong></TableCell>
                        <TableCell><strong>직책</strong></TableCell>
                        <TableCell><strong>활성 상태</strong></TableCell>
                        <TableCell align="center"><strong>관리</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from({ length: rows }).map((_, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <Skeleton variant="text" width={30} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="text" width={100} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="text" width={150} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="text" width={80} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="rounded" width={60} height={24} />
                            </TableCell>
                            <TableCell>
                                <Skeleton variant="rounded" width={60} height={24} />
                            </TableCell>
                            <TableCell align="center">
                                <Skeleton variant="circular" width={32} height={32} sx={{ display: 'inline-block', mr: 1 }} />
                                <Skeleton variant="circular" width={32} height={32} sx={{ display: 'inline-block', mr: 1 }} />
                                <Skeleton variant="circular" width={32} height={32} sx={{ display: 'inline-block' }} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

UserTableSkeleton.propTypes = {
    rows: PropTypes.number
};

export default UserTableSkeleton;
