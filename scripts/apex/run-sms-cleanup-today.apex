// Test run: export today's SMS outbound records, email admin, then delete them.
Date today = Date.today();
Id batchJobId = Database.executeBatch(new ShadikhanaSmsOutboundCleanupBatch(today, today), 200);
System.debug('SMS cleanup batch started for today: ' + batchJobId);
