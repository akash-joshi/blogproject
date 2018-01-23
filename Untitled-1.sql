delimiter $
create or replace procedure ins(_id char(20),title text,_date date,content text)
begin
if not exists(select * from article where id=_id) then
insert into dbmsproj.article values (_id,title,title,_date,content);
end if;
end $
delimiter ;