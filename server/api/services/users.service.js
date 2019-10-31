module.exports = {
  filter: () => {
    const users = [
      {
        _id: 0,
        email: "david.gahnassia@kaholo.io",
        name: "David Gahnassia",
        date_created: new Date(),
        groups: [
          {
            id: 1,
            label: "Products"
          }
        ]
      },
      {
        _id: 1,
        email: "magic@kaholo.io",
        name: "Magic",
        date_created: new Date(),
        groups: [
          {
            id: 1,
            label: "Products"
          }
        ]
      },
      {
        _id: 2,
        email: "chris@kaholo.io",
        name: "Chris",
        date_created: new Date(),
        groups: [
          {
            id: 1,
            label: "Products"
          },
          {
            id: 2,
            label: "Developper"
          }
        ]
      }
    ];
    const result = {
      items: users,
      totalCount: 3
    };
    return Promise.resolve(result);
  }
};
