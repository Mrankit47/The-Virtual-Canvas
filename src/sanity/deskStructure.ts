import { StructureBuilder } from 'sanity/structure';

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('The Virtual Canvas')
    .items([

      // 🎨 1. Artist Content
      S.listItem()
        .id('artistContent')
        .title('🎨 Artist Content')
        .child(
          S.list()
            .title('Artist Content')
            .items([
              S.documentTypeListItem('artwork').title('Artworks').id('artworks'),
              S.documentTypeListItem('gallery').title('Gallery').id('gallery'),
              S.documentTypeListItem('photography').title('Photography').id('photography'),
              S.documentTypeListItem('photographyCategory').title('Photography Categories').id('photographyCategories'),
              S.documentTypeListItem('category').title('Categories').id('categories'),
              S.documentTypeListItem('processStep').title('Process Steps').id('processSteps'),
            ])
        ),

      S.divider(),

      // 🖌️ 2. Studio Configurator
      S.listItem()
        .id('studioConfig')
        .title('🖌️ Studio Configurator')
        .child(
          S.list()
            .title('Studio Configurator')
            .items([
              S.documentTypeListItem('artStyle').title('Art Styles').id('artStyles'),
              S.documentTypeListItem('sizeOption').title('Size Options').id('sizeOptions'),
              S.documentTypeListItem('paperType').title('Paper Types').id('paperTypes'),
            ])
        ),

      S.divider(),

      // 📦 3. Orders Management
      S.listItem()
        .id('ordersManagement')
        .title('📦 Orders Management')
        .child(S.documentTypeList('order').title('All Orders')),

      S.divider(),

      // 🏷️ 4. Commerce
      S.listItem()
        .id('commerce')
        .title('🏷️ Commerce')
        .child(
          S.list()
            .title('Commerce')
            .items([
              S.documentTypeListItem('coupon').title('Coupons').id('coupons'),
            ])
        ),

      S.divider(),

      // ⚙️ 5. System
      S.listItem()
        .id('system')
        .title('⚙️ System')
        .child(
          S.list()
            .title('System')
            .items([
              S.documentTypeListItem('userProfile').title('User Profiles').id('userProfiles'),
              S.documentTypeListItem('notification').title('Notifications').id('notifications'),
            ])
        ),
    ]);

