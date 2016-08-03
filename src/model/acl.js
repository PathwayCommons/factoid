let isPrivateId = ( userId, ele ) => userId && userId === ele.privateId;

export default function acl( collection ){
  collection.allow({
    insert: function( userId, ele ){
      return isPrivateId( userId, ele );
    },

    update: function( userId, ele, fieldNames, modifier ){
      // privateId is not writable
      if( fieldNames.indexOf('privateId') >= 0 ){
        return false;
      }

      return isPrivateId( userId, ele );
    },

    remove: function( userId, ele ){
      return isPrivateId( userId, ele );
    }
  });
}
