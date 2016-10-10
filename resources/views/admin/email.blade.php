@extends('admin.layout')

@section('content')
<div class="col-lg-2">
    <a href="/admin/emails" class="btn btn-default">
        <span class="glyphicon glyphicon-triangle-left" aria-hidden="true"></span> Emails
    </a>
    <table class="table table-hover">
        <tr>
            <th>
                Created Date
            </th>
            <td>
                {{$email->created_at}}
            </td>
        </tr>
        <tr>
            <th>
                Address
            </th>
            <td>
                {{$email->address}}
            </td>
        </tr>
        <tr>
            <th>
                Subject
            </th>
            <td>
                {{$email->subject}}
            </td>
        </tr>
    </table>
    <a class="btn btn-primary" href="/email/{{$email->code}}">
        Raw
    </a>
    <hr />
</div>
<div class="col-lg-10">
    <h2>Content</h2>
    <div class="well">
        {!! $content !!}
    </div>
</div>
@stop