import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Aggregate top portfolios by P&L
    const leaderboard = await Portfolio.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$user',
          name: '$userInfo.name',
          avatar: '$userInfo.avatar',
          totalPnL: 1,
          totalPnLPercent: 1,
          totalCurrentValue: 1,
          cashBalance: 1,
          holdingsCount: { $size: '$holdings' },
        },
      },
      { $sort: { totalPnL: -1 } },
      { $limit: +limit },
    ]);

    // Mark current user's rank
    const currentUserrank = leaderboard.findIndex(
      (l) => l.userId.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: leaderboard,
      myRank: currentUserrank >= 0 ? currentUserrank + 1 : null,
    });
  } catch (err) { next(err); }
};
