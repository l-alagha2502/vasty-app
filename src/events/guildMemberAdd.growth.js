const Invite = require('../database/models/Invite');

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, member) {
        if (!member.guild) return;

        try {
            const cachedInvites = client.invites.get(member.guild.id);
            const newInvites = await member.guild.invites.fetch();
            
            let inviter = null;
            let inviteCode = null;

            for (const [code, invite] of newInvites) {
                const cachedUses = cachedInvites.get(code);
                if (cachedUses !== undefined && invite.uses > cachedUses) {
                    inviter = invite.inviter;
                    inviteCode = code;
                    break;
                }
            }

            // Update cache
            client.invites.set(member.guild.id, new Map(newInvites.map(i => [i.code, i.uses])));

            if (inviter) {
                // Log invitation in DB
                let inviteData = await Invite.findOne({ guildId: member.guild.id, code: inviteCode });
                if (!inviteData) {
                    inviteData = new Invite({
                        guildId: member.guild.id,
                        inviterId: inviter.id,
                        code: inviteCode,
                        uses: 0,
                        total: 0,
                        fake: 0,
                        left: 0
                    });
                }
                
                inviteData.uses += 1;
                inviteData.total += 1;
                await inviteData.save();

                console.log(`[Growth] ${member.user.tag} was invited by ${inviter.tag} using code ${inviteCode}`);
            }

        } catch (error) {
            console.error('[Event: guildMemberAdd.growth] Error:', error);
        }
    }
};
